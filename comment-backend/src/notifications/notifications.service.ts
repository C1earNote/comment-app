import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  @OnEvent('comment.replied')
  async handleCommentReply(payload: {
    fromUserId: number;
    toUserId: number;
    commentId: number;
  }) {
    const notification = this.notificationRepo.create({
      fromUser: { id: payload.fromUserId } as any,
      toUser: { id: payload.toUserId } as any,
      commentId: payload.commentId,
    });
    await this.notificationRepo.save(notification);
  }

  async findUserNotifications(userId: number) {
    return this.notificationRepo.find({
      where: { toUser: { id: userId } },
      order: { createdAt: 'DESC' },
      relations: ['fromUser'],
    });
  }

  async markAsRead(id: number) {
    const notification = await this.notificationRepo.findOneBy({ id });
    if (notification) {
      notification.read = true;
      return this.notificationRepo.save(notification);
    }
    return null;
  }

  async markAsUnread(id: number) {
    const notification = await this.notificationRepo.findOneBy({ id });
    if (notification) {
      notification.read = false;
      return this.notificationRepo.save(notification);
    }
    return null;
  }
}