import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { databaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { BearerTokenMiddleware } from './common/middleware/bearer-token.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: (() => {
        const env = process.env.NODE_ENV;
        if (env === 'production') return '.env.production';
        if (env === 'development') return '.env.development';
        return '.env.local';
      })(),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    CommonModule,
    // Add your feature modules here
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BearerTokenMiddleware).forRoutes('*');
  }
}
