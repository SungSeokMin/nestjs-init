import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, catchError, tap } from 'rxjs';
import { DataSource } from 'typeorm';

export const QUERY_RUNNER_KEY = 'queryRunner';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    (request as any)[QUERY_RUNNER_KEY] = queryRunner;

    return next.handle().pipe(
      tap(async () => {
        await queryRunner.commitTransaction();
        await queryRunner.release();
      }),
      catchError(async (error) => {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw error;
      }),
    );
  }
}

export class TransactionInterceptorNotFoundException extends InternalServerErrorException {
  constructor() {
    super('QueryRunner not found. Is TransactionInterceptor applied?');
  }
}
