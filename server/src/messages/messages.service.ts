import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConversationsService } from '../conversations/conversations.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetConversationMessagesDto } from './dto/get-conversation-messages.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async createMessage(senderId: string, createMessageDto: CreateMessageDto) {
    const content = createMessageDto.content.trim();

    if (!content) {
      throw new BadRequestException('Message content is required');
    }

    let conversationId = createMessageDto.conversationId;

    if (!conversationId) {
      if (!createMessageDto.recipientId) {
        throw new BadRequestException(
          'Either conversationId or recipientId is required',
        );
      }

      const conversation =
        await this.conversationsService.getOrCreateDirectConversation(
          senderId,
          createMessageDto.recipientId,
        );

      conversationId = conversation.id;
    }

    const resolvedConversationId = conversationId;

    await this.conversationsService.ensureConversationMember(
      resolvedConversationId,
      senderId,
    );

    const message = await this.prisma.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          conversationId: resolvedConversationId,
          senderId,
          content,
        },
        select: this.messageSelect,
      });

      await tx.conversation.update({
        where: { id: resolvedConversationId },
        data: {
          lastMessageAt: createdMessage.createdAt,
        },
      });

      return createdMessage;
    });

    return message;
  }

  async getConversationMessages(
    userId: string,
    conversationId: string,
    query: GetConversationMessagesDto,
  ) {
    await this.conversationsService.ensureConversationMember(conversationId, userId);

    const limit = query.limit ?? 20;

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
      select: this.messageSelect,
    });

    const hasMore = messages.length > limit;
    const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore
      ? paginatedMessages[paginatedMessages.length - 1]?.id ?? null
      : null;

    return {
      items: paginatedMessages,
      pageInfo: {
        nextCursor,
        hasMore,
        limit,
      },
    };
  }

  async getMessageRecipients(conversationId: string) {
    const participants =
      await this.conversationsService.getConversationParticipants(conversationId);

    return participants.map((participant: { userId: string }) => participant.userId);
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, conversationId: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.conversationsService.ensureConversationMember(
      message.conversationId,
      userId,
    );

    await this.prisma.message.delete({ where: { id: messageId } });

    return { id: message.id, conversationId: message.conversationId };
  }

  private readonly messageSelect = {
    id: true,
    conversationId: true,
    senderId: true,
    content: true,
    createdAt: true,
    updatedAt: true,
    sender: {
      select: {
        id: true,
        username: true,
        profileImage: true,
      },
    },
  } satisfies Prisma.MessageSelect;
}
