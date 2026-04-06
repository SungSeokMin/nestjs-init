import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { Request } from 'express';
import { QueryRunner } from 'typeorm';
import { QUERY_RUNNER_KEY } from '../interceptors/transaction.interceptor';

export const QueryRunnerDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): QueryRunner => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const queryRunner = (request as any)[QUERY_RUNNER_KEY];

    if (!queryRunner) {
      throw new InternalServerErrorException(
        'QueryRunner not found. Is TransactionInterceptor applied?',
      );
    }

    return queryRunner;
  },
);
