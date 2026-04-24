import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async getOrCreateDirectConversation(currentUserId: string, otherUserId: string) {
    if (currentUserId === otherUserId) {
      throw new BadRequestException('You cannot create a conversation with yourself');
    }

    const otherUser = await this.usersService.findById(otherUserId);

    if (!otherUser) {
      throw new NotFoundException('User not found');
    }

    const directKey = this.buildDirectKey(currentUserId, otherUserId);

    const existingConversation = await this.prisma.conversation.findUnique({
      where: { directKey },
      select: this.conversationSelect,
    });

    if (existingConversation) {
      return existingConversation;
    }

    return this.prisma.conversation.create({
      data: {
        type: 'DIRECT',
        directKey,
        participants: {
          create: [{ userId: currentUserId }, { userId: otherUserId }],
        },
      },
      select: this.conversationSelect,
    });
  }

  async getUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      select: this.conversationSelect,
    });
  }

  async ensureConversationMember(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
      select: { id: true },
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }
  }

  async getConversationParticipants(conversationId: string) {
    return this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: {
        userId: true,
      },
    });
  }

  async deleteConversation(userId: string, conversationId: string) {
    await this.ensureConversationMember(conversationId, userId);

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }

  private buildDirectKey(firstUserId: string, secondUserId: string) {
    return [firstUserId, secondUserId].sort().join(':');
  }

  private readonly conversationSelect = {
    id: true,
    type: true,
    directKey: true,
    createdAt: true,
    updatedAt: true,
    lastMessageAt: true,
    participants: {
      select: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
    },
    _count: {
      select: {
        messages: true,
      },
    },
  } satisfies Prisma.ConversationSelect;
}
