import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':userId')
  getUserNotifications(@Param('userId') userId: number) {
    return this.notificationsService.findUserNotifications(userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: number) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch(':id/unread')
  markAsUnread(@Param('id') id: number) {
    return this.notificationsService.markAsUnread(id);
  }
}