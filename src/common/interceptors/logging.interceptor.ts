import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { SKIP_LOGGING_KEY } from '../decorators/skip-logging.decorator';

const BOT_PATTERN = /bot|crawler|spider|crawling/i;

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skipLogging = this.reflector.getAllAndOverride<boolean>(SKIP_LOGGING_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipLogging) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const userAgent = request.headers['user-agent'] ?? '';

    if (BOT_PATTERN.test(userAgent)) return next.handle();

    const { method, url } = request;
    const now = Date.now();

    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      this.logger.log(
        `→ ${method} ${url} | body: ${JSON.stringify(request.body)} | query: ${JSON.stringify(request.query)}`,
      );
    } else {
      this.logger.log(`→ ${method} ${url}`);
    }

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now;
        const status = response.statusCode;

        if (status >= 500) {
          this.logger.error(`← ${method} ${url} ${status} (${elapsed}ms)`);
        } else if (status >= 400) {
          this.logger.warn(`← ${method} ${url} ${status} (${elapsed}ms)`);
        } else {
          this.logger.log(`← ${method} ${url} ${status} (${elapsed}ms)`);
        }
      }),
    );
  }
}
