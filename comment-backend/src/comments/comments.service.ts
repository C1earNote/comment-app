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
    let parentComment: Comment | undefined = undefined;
    if (parentId) {
      const foundParent = await this.commentRepo.findOne({ where: { id: parentId } });
      if (!foundParent) {
        throw new NotFoundException('Parent comment not found');
      }
      parentComment = foundParent;
    }
    const comment = this.commentRepo.create({
      content,
      user: { id: userId } as any,
      parent: parentComment,
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
    // Fetch all comments (optionally filter by parentId)
    const allComments = await this.commentRepo.find({
      relations: ['user', 'parent'],
      order: { createdAt: 'ASC' },
    });

    // Helper to build nested tree
    function buildTree(comments, parentId: number | null) {
      return comments
        .filter(c => (c.parent ? c.parent.id : null) === parentId)
        .map(comment => {
          // Recursively build children
          const children = buildTree(comments, comment.id);
          return {
            id: comment.id,
            content: comment.content,
            user: {
              id: comment.user?.id ?? null,
              username: comment.user?.username ?? 'Unknown',
              createdAt: comment.user?.createdAt ?? null,
            },
            parent: comment.parent ? { id: comment.parent.id } : null,
            children,
            deleted: comment.deleted,
            deletedAt: comment.deletedAt,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            replyingToId: comment.parent?.id ?? null,
          };
        });
    }

    if (typeof parentId === 'number') {
      // Find the parent comment and nest its children
      return buildTree(allComments, parentId as number | null);
    } else {
      // Root comments (no parent)
      return buildTree(allComments, null);
    }
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
      throw new NotFoundException('Comment not found or not deleted');

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
