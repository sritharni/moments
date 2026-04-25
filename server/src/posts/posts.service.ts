import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostVisibility, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(authorId: string, createPostDto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        content: createPostDto.content,
        imageUrl: createPostDto.imageUrl,
        visibility: createPostDto.visibility ?? PostVisibility.PUBLIC,
        authorId,
      },
      select: this.postSelect,
    });
  }

  async getFeed(currentUserId: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        author: {
          followers: { some: { followerId: currentUserId } },
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        ...this.postSelect,
        likes: { where: { userId: currentUserId }, select: { id: true }, take: 1 },
      },
    });

    return posts.map(({ likes, ...post }) => ({ ...post, isLiked: likes.length > 0 }));
  }

  async getPostsByUser(userId: string, viewerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (userId !== viewerId) {
      const followRecord = await this.prisma.follow.findFirst({
        where: {
          followerId: viewerId,
          followingId: userId,
        },
        select: { id: true },
      });

      if (!followRecord) {
        throw new ForbiddenException('Follow this user to view their posts');
      }
    }

    const posts = await this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        ...this.postSelect,
        likes: { where: { userId: viewerId }, select: { id: true }, take: 1 },
      },
    });

    return posts.map(({ likes, ...post }) => ({ ...post, isLiked: likes.length > 0 }));
  }

  async deletePost(currentUserId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    try {
      await this.prisma.post.delete({
        where: { id: postId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Post not found');
      }

      throw error;
    }

    return {
      success: true,
      message: 'Post deleted successfully',
    };
  }

  private readonly postSelect = {
    id: true,
    content: true,
    imageUrl: true,
    visibility: true,
    authorId: true,
    createdAt: true,
    updatedAt: true,
    author: {
      select: {
        id: true,
        username: true,
        profileImage: true,
      },
    },
    _count: {
      select: {
        comments: true,
        likes: true,
      },
    },
  } satisfies Prisma.PostSelect;
}
