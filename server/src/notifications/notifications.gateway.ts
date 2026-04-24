import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

type AuthenticatedSocket = Socket & {
  data: { userId?: string };
};

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements
    OnGatewayConnection<AuthenticatedSocket>,
    OnGatewayDisconnect<AuthenticatedSocket>
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: process.env.JWT_SECRET || 'change-me-in-production',
      });

      client.data.userId = payload.sub;
      client.join(`notif:user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: AuthenticatedSocket) {}

  @SubscribeMessage('notifications:read-all')
  async handleReadAll(client: AuthenticatedSocket) {
    const userId = client.data.userId;
    if (!userId) return;
    await this.notificationsService.markAllRead(userId);
  }

  async createAndEmit(dto: CreateNotificationDto) {
    const notification = await this.notificationsService.create(dto);
    if (this.server) {
      this.server
        .to(`notif:user:${dto.userId}`)
        .emit('notification:new', notification);
    }
    return notification;
  }

  private extractToken(client: AuthenticatedSocket) {
    const auth = client.handshake.auth.token;
    if (typeof auth === 'string') return auth.replace(/^Bearer\s+/i, '');
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string') return header.replace(/^Bearer\s+/i, '');
    return null;
  }
}
