import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LikesService } from './likes.service';

@UseGuards(JwtAuthGuard)
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('post/:postId')
  likePost(@Request() req: { user: { sub: string } }, @Param('postId') postId: string) {
    return this.likesService.likePost(req.user.sub, postId);
  }

  @Delete('post/:postId')
  unlikePost(@Request() req: { user: { sub: string } }, @Param('postId') postId: string) {
    return this.likesService.unlikePost(req.user.sub, postId);
  }

  @Get('post/:postId/count')
  getPostLikeCount(@Param('postId') postId: string) {
    return this.likesService.getPostLikeCount(postId);
  }

  @Post('comment/:commentId')
  likeComment(@Request() req: { user: { sub: string } }, @Param('commentId') commentId: string) {
    return this.likesService.likeComment(req.user.sub, commentId);
  }

  @Delete('comment/:commentId')
  unlikeComment(@Request() req: { user: { sub: string } }, @Param('commentId') commentId: string) {
    return this.likesService.unlikeComment(req.user.sub, commentId);
  }
}
