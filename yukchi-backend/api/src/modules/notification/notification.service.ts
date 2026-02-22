import { Injectable, Logger, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '@config/prisma.service';
import { TelegramBotService } from '@modules/telegram/telegram-bot.service';
import { BOT_QUEUE, CLIENT_QUEUE } from './queues/queue.constants';

export interface BotNotificationPayload {
  message: string;
  notificationLogId?: string;
}

export interface ClientNotificationPayload {
  phone: string;
  message: string;
  shopId?: string;
  notificationLogId?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramBot: TelegramBotService,
    @Inject(BOT_QUEUE) private readonly botQueue: Queue,
    @Inject(CLIENT_QUEUE) private readonly clientQueue: Queue,
  ) {}

  async sendBotNotification(payload: BotNotificationPayload): Promise<void> {
    const log = await this.prisma.notificationLog.create({
      data: {
        channel: 'bot',
        message: payload.message,
        status: 'pending',
      },
    });

    await this.botQueue.add(
      'send-bot-message',
      { ...payload, notificationLogId: log.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    );
  }

  async sendClientNotification(payload: ClientNotificationPayload): Promise<void> {
    const log = await this.prisma.notificationLog.create({
      data: {
        shopId: payload.shopId,
        channel: 'client',
        message: payload.message,
        status: 'pending',
      },
    });

    await this.clientQueue.add(
      'send-client-message',
      { ...payload, notificationLogId: log.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 },
        removeOnComplete: 100,
        removeOnFail: 200,
        delay: 0,
      },
    );
  }

  async notifyAllDebtors(minDebt = '0'): Promise<void> {
    const debtors = await this.prisma.shop.findMany({
      where: {
        deletedAt: null,
        status: 'active',
        debt: { gt: minDebt },
      },
    });

    this.logger.log(`Queuing notifications for ${debtors.length} debtors`);

    for (const shop of debtors) {
      const message = `Hello ${shop.ownerName}, your current debt is ${shop.debt}. Please settle your outstanding balance.`;
      await this.sendClientNotification({
        phone: shop.phone,
        message,
        shopId: shop.id,
      });
    }
  }

  async getNotificationLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.prisma.notificationLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { shop: { select: { id: true, name: true } } },
    });
  }
}
