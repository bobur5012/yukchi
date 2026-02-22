import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';

export interface SecurityLogParams {
  userId?: string;
  event: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: SecurityLogParams): Promise<void> {
    try {
      await this.prisma.securityLog.create({
        data: {
          userId: params.userId,
          event: params.event,
          ip: params.ip,
          userAgent: params.userAgent,
          metadata: params.metadata as any,
        },
      });

      if (['login_failed', 'token_reuse', 'unauthorized_access'].includes(params.event)) {
        this.logger.warn(`Security event [${params.event}] from IP=${params.ip}`);
      }
    } catch (err) {
      this.logger.error(`Failed to write security log: ${(err as Error).message}`);
    }
  }

  findAll(page = 1, limit = 50, event?: string) {
    const skip = (page - 1) * limit;
    return this.prisma.securityLog.findMany({
      skip,
      take: limit,
      where: event ? { event } : {},
      orderBy: { createdAt: 'desc' },
    });
  }
}
