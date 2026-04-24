import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  createPost(
    @Request() req: { user: { sub: string } },
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.createPost(req.user.sub, createPostDto);
  }

  @Get()
  getFeed(@Request() req: { user: { sub: string } }) {
    return this.postsService.getFeed(req.user.sub);
  }

  @Get('user/:userId')
  getPostsByUser(
    @Request() req: { user: { sub: string } },
    @Param('userId') userId: string,
  ) {
    return this.postsService.getPostsByUser(userId, req.user.sub);
  }

  @Delete(':postId')
  deletePost(
    @Request() req: { user: { sub: string } },
    @Param('postId') postId: string,
  ) {
    return this.postsService.deletePost(req.user.sub, postId);
  }
}
