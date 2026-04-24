import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { NotificationType } from '@prisma/client';
import type { Server, Socket } from 'socket.io';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { JoinConversationDto } from './dto/join-conversation.dto';
import { ChatPresenceService } from './chat-presence.service';

type AuthenticatedSocket = Socket & {
  data: {
    user?: {
      sub: string;
      email: string;
      username: string;
    };
  };
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayConnection<AuthenticatedSocket>, OnGatewayDisconnect<AuthenticatedSocket>
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly presenceService: ChatPresenceService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        username?: string;
      }>(token, {
        secret: process.env.JWT_SECRET || 'change-me-in-production',
      });

      client.data.user = {
        sub: payload.sub,
        email: payload.email,
        username: payload.username ?? '',
      };

      client.join(this.buildUserRoom(payload.sub));
      this.presenceService.addConnection(payload.sub, client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.user?.sub;

    if (userId) {
      this.presenceService.removeConnection(userId, client.id);
    }
  }

  @SubscribeMessage('chat:join')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() joinConversationDto: JoinConversationDto,
  ) {
    const userId = client.data.user?.sub;

    if (!userId) {
      throw new WsException('Unauthorized');
    }

    await this.conversationsService.ensureConversationMember(
      joinConversationDto.conversationId,
      userId,
    );

    const roomName = this.buildConversationRoom(joinConversationDto.conversationId);
    await client.join(roomName);

    return {
      event: 'chat:joined',
      data: {
        conversationId: joinConversationDto.conversationId,
        room: roomName,
      },
    };
  }

  @SubscribeMessage('chat:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    const userId = client.data.user?.sub;

    if (!userId) {
      throw new WsException('Unauthorized');
    }

    const message = await this.messagesService.createMessage(userId, createMessageDto);
    const recipientIds = await this.messagesService.getMessageRecipients(
      message.conversationId,
    );
    const conversationRoom = this.buildConversationRoom(message.conversationId);

    this.server.to(conversationRoom).emit('chat:message', message);

    for (const recipientId of recipientIds) {
      this.server
        .to(this.buildUserRoom(recipientId))
        .emit('chat:message', message);

      if (recipientId !== userId) {
        void this.notificationsGateway.createAndEmit({
          userId: recipientId,
          type: NotificationType.NEW_MESSAGE,
          actorId: userId,
          referenceId: message.conversationId,
        });
      }
    }

    return {
      event: 'chat:sent',
      data: message,
    };
  }

  private extractToken(client: AuthenticatedSocket) {
    const authToken =
      typeof client.handshake.auth.token === 'string'
        ? client.handshake.auth.token
        : undefined;

    if (authToken) {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const authorizationHeader = client.handshake.headers.authorization;

    if (typeof authorizationHeader === 'string') {
      return authorizationHeader.replace(/^Bearer\s+/i, '');
    }

    return null;
  }

  private buildUserRoom(userId: string) {
    return `user:${userId}`;
  }

  private buildConversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }
}
