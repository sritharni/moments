import { Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@Request() req: { user: { sub: string } }) {
    return this.notificationsService.getForUser(req.user.sub);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: { user: { sub: string } }) {
    const count = await this.notificationsService.getUnreadCount(req.user.sub);
    return { count };
  }

  @Get('unread-counts')
  getUnreadCounts(@Request() req: { user: { sub: string } }) {
    return this.notificationsService.getUnreadCounts(req.user.sub);
  }

  @Patch('read-all')
  async markAllRead(@Request() req: { user: { sub: string } }) {
    await this.notificationsService.markAllRead(req.user.sub);
    return { success: true };
  }

  @Patch('read-chat')
  async markChatRead(@Request() req: { user: { sub: string } }) {
    await this.notificationsService.markChatRead(req.user.sub);
    return { success: true };
  }

  @Patch('read-social')
  async markSocialRead(@Request() req: { user: { sub: string } }) {
    await this.notificationsService.markSocialRead(req.user.sub);
    return { success: true };
  }

  @Patch(':id/read')
  async markRead(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    await this.notificationsService.markRead(id, req.user.sub);
    return { success: true };
  }
}
