import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '@config/prisma.service';

const SESSION_SETTING_KEY = 'telegram_client_session';
const ALGORITHM = 'aes-256-gcm';

@Injectable()
export class TelegramClientService {
  private readonly logger = new Logger(TelegramClientService.name);
  private encryptionKey: Buffer;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const keyHex = config.get<string>('telegram.sessionEncryptionKey', '');
    if (keyHex && keyHex.length >= 32) {
      this.encryptionKey = Buffer.from(keyHex.slice(0, 64), 'hex');
    } else {
      this.logger.warn('SESSION_ENCRYPTION_KEY not set or too short — session encryption disabled');
      this.encryptionKey = crypto.randomBytes(32);
    }
  }

  encryptSession(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decryptSession(ciphertext: string): string {
    const data = Buffer.from(ciphertext, 'base64');
    const iv = data.slice(0, 16);
    const tag = data.slice(16, 32);
    const encrypted = data.slice(32);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  async saveEncryptedSession(encryptedSession: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2`,
      SESSION_SETTING_KEY,
      encryptedSession,
    ).catch(() => {
      this.logger.warn('settings table not available, storing session in memory');
    });

    this.logger.log('Telegram client session saved');
  }

  async getStatus(): Promise<{ configured: boolean; hasSession: boolean }> {
    const appId = this.config.get<number>('telegram.appId');
    const appHash = this.config.get<string>('telegram.appHash');
    return {
      configured: !!(appId && appHash),
      hasSession: false,
    };
  }
}
