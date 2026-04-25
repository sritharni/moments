import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FollowRequestStatus, NotificationType, Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { UpdateProfileDto } from './dto/update-profile.dto';

type CreateUserInput = {
  username: string;
  email: string;
  password: string;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email.toLowerCase(),
        password: data.password,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: this.publicUserSelect,
    });
  }

  async findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: this.publicUserSelect,
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: this.publicUserSelect,
    });
  }

  async searchUsers(query: string) {
    if (!query.trim()) return [];

    return this.prisma.user.findMany({
      where: {
        username: { contains: query.trim(), mode: 'insensitive' },
        status: 'ACTIVE',
      },
      select: { id: true, username: true, profileImage: true, bio: true },
      take: 20,
      orderBy: { username: 'asc' },
    });
  }

  async getProfileById(id: string, viewerId?: string) {
    const [user, followRecord, followRequest] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id },
        select: {
          ...this.publicUserSelect,
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true,
            },
          },
        },
      }),
      viewerId && viewerId !== id
        ? this.prisma.follow.findFirst({
            where: { followerId: viewerId, followingId: id },
            select: { id: true },
          })
        : Promise.resolve(null),
      viewerId && viewerId !== id
        ? this.prisma.followRequest.findFirst({
            where: {
              requesterId: viewerId,
              targetId: id,
              status: FollowRequestStatus.PENDING,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      isOwnProfile: viewerId === id,
      isFollowing: Boolean(followRecord),
      hasRequestedFollow: Boolean(followRequest),
    };
  }

  async getFollowers(userId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: {
        follower: {
          select: { id: true, username: true, profileImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return follows.map((f) => f.follower);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    if (updateProfileDto.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: updateProfileDto.username,
          NOT: { id: userId },
        },
        select: { id: true },
      });

      if (existingUser) {
        throw new BadRequestException('Username is already taken');
      }
    }

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          username: updateProfileDto.username,
          bio: updateProfileDto.bio,
          profileImage: updateProfileDto.profileImage,
        },
        select: this.publicUserSelect,
      });
    } catch (error) {
      return this.handlePrismaNotFound(error);
    }
  }

  async deleteAccount(userId: string) {
    await this.ensureUserExists(userId);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      select: { id: true },
    });

    await this.prisma.$transaction([
      this.prisma.notification.deleteMany({
        where: {
          OR: [{ userId }, { actorId: userId }],
        },
      }),
      this.prisma.followRequest.deleteMany({
        where: {
          OR: [{ requesterId: userId }, { targetId: userId }],
        },
      }),
      this.prisma.follow.deleteMany({
        where: {
          OR: [{ followerId: userId }, { followingId: userId }],
        },
      }),
      ...conversations.map((conversation) =>
        this.prisma.conversation.delete({
          where: { id: conversation.id },
        }),
      ),
      this.prisma.user.delete({
        where: { id: userId },
      }),
    ]);

    return { success: true, message: 'Account deleted successfully' };
  }

  async sendFollowRequest(requesterId: string, targetId: string) {
    if (requesterId === targetId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    await this.ensureUserExists(targetId);

    const existingFollow = await this.prisma.follow.findFirst({
      where: { followerId: requesterId, followingId: targetId },
      select: { id: true },
    });

    if (existingFollow) {
      throw new BadRequestException('You already follow this user');
    }

    const request = await this.prisma.followRequest.upsert({
      where: { requesterId_targetId: { requesterId, targetId } },
      create: { requesterId, targetId },
      update: { status: FollowRequestStatus.PENDING },
      select: { id: true },
    });

    void this.notificationsGateway.createAndEmit({
      userId: targetId,
      type: NotificationType.FOLLOW_REQUEST,
      actorId: requesterId,
      referenceId: request.id,
    });

    return { success: true, message: 'Follow request sent' };
  }

  async unfollowUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    const existingFollow = await this.prisma.follow.findFirst({
      where: { followerId, followingId },
      select: { id: true },
    });

    if (!existingFollow) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.prisma.follow.delete({ where: { id: existingFollow.id } });

    return { success: true, message: 'User unfollowed successfully' };
  }

  async getPendingFollowRequests(userId: string) {
    return this.prisma.followRequest.findMany({
      where: { targetId: userId, status: FollowRequestStatus.PENDING },
      select: {
        id: true,
        createdAt: true,
        requester: {
          select: { id: true, username: true, profileImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptFollowRequest(requestId: string, userId: string) {
    const request = await this.prisma.followRequest.findUnique({
      where: { id: requestId },
      select: { id: true, requesterId: true, targetId: true, status: true },
    });

    if (!request || request.targetId !== userId) {
      throw new NotFoundException('Follow request not found');
    }

    if (request.status !== FollowRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been handled');
    }

    await this.prisma.$transaction([
      this.prisma.followRequest.update({
        where: { id: requestId },
        data: { status: FollowRequestStatus.ACCEPTED },
      }),
      this.prisma.follow.create({
        data: { followerId: request.requesterId, followingId: request.targetId },
      }),
    ]);

    void this.notificationsGateway.createAndEmit({
      userId: request.requesterId,
      type: NotificationType.FOLLOW_ACCEPTED,
      actorId: userId,
      referenceId: requestId,
    });

    return { success: true, message: 'Follow request accepted' };
  }

  async rejectFollowRequest(requestId: string, userId: string) {
    const request = await this.prisma.followRequest.findUnique({
      where: { id: requestId },
      select: { id: true, targetId: true, status: true },
    });

    if (!request || request.targetId !== userId) {
      throw new NotFoundException('Follow request not found');
    }

    if (request.status !== FollowRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been handled');
    }

    await this.prisma.followRequest.update({
      where: { id: requestId },
      data: { status: FollowRequestStatus.REJECTED },
    });

    return { success: true, message: 'Follow request rejected' };
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private handlePrismaNotFound(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('User not found');
    }

    throw error;
  }

  private readonly publicUserSelect = {
    id: true,
    username: true,
    email: true,
    bio: true,
    profileImage: true,
    role: true,
    status: true,
    emailVerified: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.UserSelect;
}
