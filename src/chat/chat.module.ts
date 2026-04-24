import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatGateway } from './chat.gateway';
import { ChatPresenceService } from './chat-presence.service';

@Module({
  imports: [
    AuthModule,
    ConversationsModule,
    MessagesModule,
    NotificationsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me-in-production',
    }),
  ],
  providers: [ChatGateway, ChatPresenceService],
})
export class ChatModule {}
