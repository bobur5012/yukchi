import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { CLIENT_QUEUE, CLIENT_QUEUE_NAME } from './queue.constants';

export const ClientQueueProvider = {
  provide: CLIENT_QUEUE,
  useFactory: (config: ConfigService) => {
    const redisUrl = new URL(config.get<string>('redis.url', 'redis://localhost:6379'));
    return new Queue(CLIENT_QUEUE_NAME, {
      connection: {
        host: redisUrl.hostname,
        port: parseInt(redisUrl.port || '6379', 10),
        password: redisUrl.password || undefined,
        tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 },
      },
    });
  },
  inject: [ConfigService],
};
