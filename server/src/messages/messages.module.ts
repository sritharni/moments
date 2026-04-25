import { Module, forwardRef } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [PrismaModule, ConversationsModule, forwardRef(() => ChatModule)],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
