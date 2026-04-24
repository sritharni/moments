import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetConversationMessagesDto } from './dto/get-conversation-messages.dto';
import { MessagesService } from './messages.service';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  createMessage(
    @Request() req: { user: { sub: string } },
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messagesService.createMessage(req.user.sub, createMessageDto);
  }

  @Get('conversation/:conversationId')
  getConversationMessages(
    @Request() req: { user: { sub: string } },
    @Param('conversationId') conversationId: string,
    @Query() query: GetConversationMessagesDto,
  ) {
    return this.messagesService.getConversationMessages(
      req.user.sub,
      conversationId,
      query,
    );
  }
}
