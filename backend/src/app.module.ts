import { Module, NestModule, MiddlewareConsumer, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MovieModule } from './movie/movie.module';
import { ScreeningModule } from './screening/screening.module';
import { ReservationModule } from './reservation/reservation.module';

const logger = new Logger('HTTP');

function LoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const { method, originalUrl } = req;
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.log(`${method} ${originalUrl} ${res.statusCode} +${ms}ms`);
  });
  next();
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MovieModule,
    ScreeningModule,
    ReservationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
