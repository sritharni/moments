import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

type CorsCallback = (error: Error | null, allow?: boolean) => void;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  const corsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: CorsCallback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isConfiguredOrigin = corsOrigins.includes(origin);
      const isLocalDevOrigin =
        /^https?:\/\/localhost(?::\d+)?$/i.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin);

      callback(null, isConfiguredOrigin || isLocalDevOrigin);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
