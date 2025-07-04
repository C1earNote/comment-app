import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load .env variables globally

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // pulled from .env file
      autoLoadEntities: true,
      synchronize: true, // Set to false in production
    }),

    EventEmitterModule.forRoot(),

    AuthModule,
    CommentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}