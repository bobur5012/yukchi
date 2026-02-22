import { Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { TelegramBotService } from '@modules/telegram/telegram-bot.service';
import { BOT_QUEUE_NAME } from '../queues/queue.constants';

export function createBotWorker(
  config: ConfigService,
  telegramBot: TelegramBotService,
): Worker {
  const logger = new Logger('BotProcessor');
  const redisUrl = new URL(config.get<string>('redis.url', 'redis://localhost:6379'));

  return new Worker(
    BOT_QUEUE_NAME,
    async (job: Job) => {
      logger.log(`Processing bot job ${job.id}`);
      const { message, notificationLogId } = job.data;
      const success = await telegramBot.sendToGroup(message, notificationLogId);
      if (!success) {
        throw new Error('Failed to send Telegram bot message');
      }
    },
    {
      connection: {
        host: redisUrl.hostname,
        port: parseInt(redisUrl.port || '6379', 10),
        password: redisUrl.password || undefined,
        tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
      },
      concurrency: 5,
    },
  );
}
