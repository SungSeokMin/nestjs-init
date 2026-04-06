import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    if (!user?.userId) {
      throw new UnauthorizedException('인증이 필요합니다.');
    }

    return true;
  }
}
