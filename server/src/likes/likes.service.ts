import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async likePost(userId: string, postId: string) {
    await this.ensurePostExists(postId);

    try {
      await this.prisma.like.create({ data: { userId, postId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('You already liked this post');
      }
      throw error;
    }

    return { success: true, message: 'Post liked', likesCount: await this.countPostLikes(postId) };
  }

  async unlikePost(userId: string, postId: string) {
    const like = await this.prisma.like.findFirst({
      where: { userId, postId },
      select: { id: true },
    });

    if (!like) throw new NotFoundException('Like not found');

    await this.prisma.like.delete({ where: { id: like.id } });

    return { success: true, message: 'Post unliked', likesCount: await this.countPostLikes(postId) };
  }

  async getPostLikeCount(postId: string) {
    await this.ensurePostExists(postId);
    return { postId, likesCount: await this.countPostLikes(postId) };
  }

  async likeComment(userId: string, commentId: string) {
    await this.ensureCommentExists(commentId);

    try {
      await this.prisma.commentLike.create({ data: { userId, commentId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('You already liked this comment');
      }
      throw error;
    }

    return { success: true, likesCount: await this.countCommentLikes(commentId) };
  }

  async unlikeComment(userId: string, commentId: string) {
    const like = await this.prisma.commentLike.findFirst({
      where: { userId, commentId },
      select: { id: true },
    });

    if (!like) throw new NotFoundException('Like not found');

    await this.prisma.commentLike.delete({ where: { id: like.id } });

    return { success: true, likesCount: await this.countCommentLikes(commentId) };
  }

  private async ensurePostExists(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new NotFoundException('Post not found');
  }

  private async ensureCommentExists(commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId }, select: { id: true } });
    if (!comment) throw new NotFoundException('Comment not found');
  }

  private countPostLikes(postId: string) {
    return this.prisma.like.count({ where: { postId } });
  }

  private countCommentLikes(commentId: string) {
    return this.prisma.commentLike.count({ where: { commentId } });
  }
}
