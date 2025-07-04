import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './comment.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepo: Repository<Comment>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(userId: number, content: string, parentId?: number) {
    const comment = this.commentRepo.create({
      content,
      user: { id: userId } as any,
      parent: parentId ? ({ id: parentId } as any) : undefined,
    });

    const saved = await this.commentRepo.save(comment);

    // Emit notification if it's a reply
    if (parentId) {
      const parent = await this.commentRepo.findOne({
        where: { id: parentId },
        relations: ['user'],
      });

      if (parent && parent.user.id !== userId) {
        this.eventEmitter.emit('comment.replied', {
          fromUserId: userId,
          toUserId: parent.user.id,
          commentId: saved.id,
        });
      }
    }

    return saved;
  }

  async findThread(parentId?: number) {
    return this.commentRepo.find({
      where: parentId
        ? { parent: { id: parentId } }
        : { parent: IsNull() },
      relations: ['children', 'user'],
      order: { createdAt: 'ASC' },
    });
  }

  async edit(userId: number, commentId: number, newContent: string) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.user.id !== userId) throw new ForbiddenException('Not your comment');

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (comment.createdAt < fifteenMinutesAgo) {
      throw new ForbiddenException('Cannot edit after 15 minutes');
    }

    comment.content = newContent;
    return this.commentRepo.save(comment);
  }

  async softDelete(userId: number, commentId: number) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.user.id !== userId) throw new ForbiddenException('Not your comment');

    comment.deleted = true;
    comment.deletedAt = new Date();
    return this.commentRepo.save(comment);
  }

  async restore(userId: number, commentId: number) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment || !comment.deleted)
      throw new NotFoundException('Comment not found or not deleted');

    if (comment.user.id !== userId)
      throw new ForbiddenException('Not your comment');

    if (!comment.deletedAt)
      throw new ForbiddenException('Restore time expired');

    const now = new Date();
    const diff = (now.getTime() - comment.deletedAt.getTime()) / 1000;

    if (diff > 15 * 60) {
      throw new ForbiddenException('Restore time expired');
    }

    comment.deleted = false;
    comment.deletedAt = null;
    return this.commentRepo.save(comment);
  }
}