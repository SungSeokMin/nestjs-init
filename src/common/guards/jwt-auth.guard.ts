import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { userId: number };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user?.userId) {
      throw new UnauthorizedException('인증이 필요합니다.');
    }

    return true;
  }
}
