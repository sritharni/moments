import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatGateway } from '../chat/chat.gateway';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetConversationMessagesDto } from './dto/get-conversation-messages.dto';
import { MessagesService } from './messages.service';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

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

  @Delete(':id')
  async deleteMessage(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    const result = await this.messagesService.deleteMessage(req.user.sub, id);
    await this.chatGateway.broadcastMessageDeleted(result);
    return { success: true };
  }
}
