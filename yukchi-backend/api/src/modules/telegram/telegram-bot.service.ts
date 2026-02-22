import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@config/prisma.service';

// node-telegram-bot-api is CommonJS; default import fails at runtime in compiled output
const TelegramBot = require('node-telegram-bot-api') as new (
  token: string,
  options?: { polling?: boolean }
) => {
  sendMessage: (chatId: string, text: string, options?: { parse_mode?: string }) => Promise<any>;
};

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: InstanceType<typeof TelegramBot> | null = null;
  private groupChatId: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const token = this.config.get<string>('telegram.botToken');
    const chatId = this.config.get<string>('telegram.groupChatId');

    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — bot notifications disabled');
      return;
    }

    this.groupChatId = chatId || null;
    this.bot = new TelegramBot(token, { polling: false });
    this.logger.log('Telegram Bot initialized');
  }

  async sendToGroup(message: string, notificationLogId?: string): Promise<boolean> {
    if (!this.bot || !this.groupChatId) {
      this.logger.warn('Telegram bot not configured — skipping group notification');
      return false;
    }

    try {
      await this.bot.sendMessage(this.groupChatId, message, { parse_mode: 'HTML' });
      this.logger.log(`Message sent to group ${this.groupChatId}`);

      if (notificationLogId) {
        await this.prisma.notificationLog.update({
          where: { id: notificationLogId },
          data: { status: 'sent', sentAt: new Date() },
        });
      }
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send message to group: ${error.message}`);

      if (notificationLogId) {
        await this.prisma.notificationLog.update({
          where: { id: notificationLogId },
          data: { status: 'failed', error: error.message },
        });
      }
      return false;
    }
  }

  async notifyDebtorGroup(shopName: string, ownerName: string, debt: string): Promise<void> {
    const message = [
      `⚠️ <b>Debtor Notification</b>`,
      ``,
      `Shop: <b>${shopName}</b>`,
      `Owner: ${ownerName}`,
      `Debt: <b>${debt}</b>`,
      ``,
      `Sent at: ${new Date().toISOString()}`,
    ].join('\n');

    await this.sendToGroup(message);
  }

  async notifyTripCreated(tripName: string, budget: string, currency: string): Promise<void> {
    const message = [
      `✅ <b>New Trip Created</b>`,
      ``,
      `Trip: <b>${tripName}</b>`,
      `Budget: ${budget} ${currency}`,
    ].join('\n');

    await this.sendToGroup(message);
  }
}
