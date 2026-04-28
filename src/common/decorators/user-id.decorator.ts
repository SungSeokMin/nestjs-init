import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { userId: number };
}

export const UserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): number => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  const userId = request.user?.userId;

  if (!userId) {
    throw new UnauthorizedException('인증이 필요합니다.');
  }

  return userId;
});
