import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req,
    @Body('content') content: string,
    @Body('parentId') parentId?: number,
  ) {
    const userId = req.user.sub;
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

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  edit(
    @Req() req,
    @Param('id') id: number,
    @Body('content') content: string,
  ) {
    const userId = req.user.sub;
    return this.commentsService.edit(userId, id, content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  softDelete(@Req() req, @Param('id') id: number) {
    const userId = req.user.sub;
    return this.commentsService.softDelete(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restore(@Req() req, @Param('id') id: number) {
    const userId = req.user.sub;
    return this.commentsService.restore(userId, id);
  }
}
