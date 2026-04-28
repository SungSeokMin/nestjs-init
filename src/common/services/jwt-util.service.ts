import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AccessTokenPayload {
  id: number;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtUtilService {
  constructor(private readonly jwtService: JwtService) {}

  createAccessToken(userId: number): string {
    return this.jwtService.sign(
      { id: userId },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h',
      },
    );
  }

  createRefreshToken(): string {
    const payload = { type: 'refresh', random: Math.random() };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '30d',
    });
  }

  createRefreshTokenExpiresAt(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 30);
    return now;
  }

  getUserId(token: string): number {
    const payload = this.jwtService.verify<AccessTokenPayload>(token, {
      secret: process.env.JWT_SECRET,
    });
    return payload.id;
  }

  getExpiresAt(token: string): Date {
    const payload = this.jwtService.decode<AccessTokenPayload>(token);
    return new Date(payload.exp * 1000);
  }
}
