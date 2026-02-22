import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface RefreshPayload {
  sub: string;
  jti: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token,
        ExtractJwt.fromBodyField('refreshToken'),
      ]),
      secretOrKey: config.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  async validate(req: Request, payload: RefreshPayload) {
    const rawToken =
      req?.cookies?.refresh_token ||
      req?.body?.refreshToken;

    if (!rawToken) throw new UnauthorizedException('Refresh token not found');

    return { userId: payload.sub, jti: payload.jti, rawToken };
  }
}
