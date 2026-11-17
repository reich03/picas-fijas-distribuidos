import { HttpException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ exposedHeaders: ['x-pod'] });
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('x-pod', process.env.HOSTNAME || 'local');
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errores) => {
        const primero = errores[0];
        const mensaje = primero?.constraints
          ? Object.values(primero.constraints)[0]
          : 'datos invalidos';
        return new HttpException({ mensaje }, 400);
      },
    }),
  );
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT) || 3000);
}

bootstrap();
