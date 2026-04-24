import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

const notificationSelect = {
  id: true,
  type: true,
  referenceId: true,
  read: true,
  createdAt: true,
  actor: { select: { id: true, username: true, profileImage: true } },
} as const;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        actorId: dto.actorId,
        referenceId: dto.referenceId,
      },
      select: notificationSelect,
    });
  }

  async getForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: notificationSelect,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  async getUnreadCounts(userId: string) {
    const [chat, social] = await Promise.all([
      this.prisma.notification.count({
        where: { userId, read: false, type: 'NEW_MESSAGE' },
      }),
      this.prisma.notification.count({
        where: { userId, read: false, type: { in: ['FOLLOW_REQUEST', 'FOLLOW_ACCEPTED'] } },
      }),
    ]);
    return { chat, social };
  }

  async markRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async markChatRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false, type: 'NEW_MESSAGE' },
      data: { read: true },
    });
  }

  async markSocialRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false, type: { in: ['FOLLOW_REQUEST', 'FOLLOW_ACCEPTED'] } },
      data: { read: true },
    });
  }
}
