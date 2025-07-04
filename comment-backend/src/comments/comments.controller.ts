import {
  Controller, Post, Body, Param, Put, Delete, Patch, Query, Get
} from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Body('userId') userId: number,
    @Body('content') content: string,
    @Body('parentId') parentId?: number,
  ) {
    return this.commentsService.create(userId, content, parentId);
  }

  @Get()
  findRootComments() {
    return this.commentsService.findThread();
  }

  @Get(':id/replies')
  findReplies(@Param('id') id: number) {
    return this.commentsService.findThread(id);
  }

  @Put(':id')
  edit(
    @Param('id') id: number,
    @Body('userId') userId: number,
    @Body('content') content: string,
  ) {
    return this.commentsService.edit(userId, id, content);
  }

  @Delete(':id')
  softDelete(
    @Param('id') id: number,
    @Body('userId') userId: number,
  ) {
    return this.commentsService.softDelete(userId, id);
  }

  @Patch(':id/restore')
  restore(
    @Param('id') id: number,
    @Body('userId') userId: number,
  ) {
    return this.commentsService.restore(userId, id);
  }
}
