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
import { ConversationsService } from './conversations.service';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  getMyConversations(@Request() req: { user: { sub: string } }) {
    return this.conversationsService.getUserConversations(req.user.sub);
  }

  @Post('direct/:userId')
  getOrCreateDirectConversation(
    @Request() req: { user: { sub: string } },
    @Param('userId') userId: string,
  ) {
    return this.conversationsService.getOrCreateDirectConversation(
      req.user.sub,
      userId,
    );
  }

  @Delete(':conversationId')
  deleteConversation(
    @Request() req: { user: { sub: string } },
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationsService.deleteConversation(req.user.sub, conversationId);
  }
}
