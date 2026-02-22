import {
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { PrismaService } from '@config/prisma.service';
import { REDIS_CLIENT } from '@config/redis.module';
import { SecurityService } from '@modules/security/security.service';

const JTI_BLACKLIST_TTL = 60 * 60 * 24 * 31; // 31 days in seconds

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly securityService: SecurityService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async login(phone: string, password: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      await this.securityService.log({
        event: 'login_failed',
        ip,
        userAgent,
        metadata: { phone, reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.securityService.log({
        userId: user.id,
        event: 'login_failed',
        ip,
        userAgent,
        metadata: { reason: 'invalid_password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.phone, user.role);

    await this.securityService.log({
      userId: user.id,
      event: 'login_success',
      ip,
      userAgent,
    });

    return { user: { id: user.id, name: user.name, phone: user.phone, role: user.role }, ...tokens };
  }

  async refresh(userId: string, jti: string, rawToken: string) {
    const isBlacklisted = await this.redis.get(`jti:blacklist:${jti}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { jti },
      include: { user: { select: { id: true, phone: true, role: true } } },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { jti },
      data: { revokedAt: new Date() },
    });
    await this.redis.setex(`jti:blacklist:${jti}`, JTI_BLACKLIST_TTL, '1');

    const { user } = storedToken;
    return this.generateTokens(user.id, user.phone, user.role);
  }

  async logout(jti: string) {
    await this.prisma.refreshToken.updateMany({
      where: { jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.redis.setex(`jti:blacklist:${jti}`, JTI_BLACKLIST_TTL, '1');
  }

  private async generateTokens(userId: string, phone: string, role: string) {
    const jti = uuidv4();
    const accessSecret = this.config.get<string>('jwt.accessSecret');
    const refreshSecret = this.config.get<string>('jwt.refreshSecret');
    const accessExpiresIn = this.config.get<string>('jwt.accessExpiresIn', '15m');
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn', '30d');

    const accessToken = this.jwtService.sign(
      { sub: userId, phone, role, jti },
      { secret: accessSecret, expiresIn: accessExpiresIn },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, jti },
      { secret: refreshSecret, expiresIn: refreshExpiresIn },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: { jti, userId, expiresAt },
    });

    return { accessToken, refreshToken, jti };
  }
}
