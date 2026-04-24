import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPostComments(postId: string, viewerId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        postId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, username: true, profileImage: true } },
        _count: { select: { commentLikes: true } },
        commentLikes: {
          where: { userId: viewerId },
          select: { id: true },
          take: 1,
        },
      },
    });

    return comments.map(({ commentLikes, ...comment }) => ({
      ...comment,
      isLiked: commentLikes.length > 0,
    }));
  }

  async addComment(
    userId: string,
    postId: string,
    createCommentDto: CreateCommentDto,
  ) {
    await this.ensurePostExists(postId);

    return this.prisma.comment.create({
      data: { content: createCommentDto.content, postId, userId },
      select: this.commentSelect,
    });
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    try {
      await this.prisma.comment.delete({ where: { id: commentId } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Comment not found');
      }
      throw error;
    }

    return { success: true, message: 'Comment deleted successfully' };
  }

  private async ensurePostExists(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
  }

  private readonly commentSelect = {
    id: true,
    content: true,
    postId: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    user: { select: { id: true, username: true, profileImage: true } },
  } satisfies Prisma.CommentSelect;
}
