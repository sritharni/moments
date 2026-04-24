import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';

@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('post/:postId')
  getPostComments(
    @Request() req: { user: { sub: string } },
    @Param('postId') postId: string,
  ) {
    return this.commentsService.getPostComments(postId, req.user.sub);
  }

  @Post('post/:postId')
  addComment(
    @Request() req: { user: { sub: string } },
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.addComment(req.user.sub, postId, createCommentDto);
  }

  @Delete(':commentId')
  deleteComment(
    @Request() req: { user: { sub: string } },
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.deleteComment(req.user.sub, commentId);
  }
}
