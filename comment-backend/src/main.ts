import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // I have made this so used all origin for development only
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
