import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { GramService } from './services/gram.service';
import { SessionService } from './services/session.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { processClientMessage } from './processors/client-message.processor';

const CLIENT_QUEUE_NAME = 'notifications-client';

export interface WorkerConfig {
  redisUrl: string;
  appId: number;
  appHash: string;
  encryptionKey: string;
  encryptedSession?: string;
  circuitBreakerThreshold: number;
  circuitBreakerResetMs: number;
}

export class TelegramWorker {
  private worker: Worker | null = null;
  private gramService: GramService;
  private circuitBreaker: CircuitBreakerService;
  private isShuttingDown = false;

  constructor(private readonly config: WorkerConfig) {
    const sessionService = new SessionService(config.encryptionKey);
    this.gramService = new GramService({
      appId: config.appId,
      appHash: config.appHash,
      sessionService,
      encryptedSession: config.encryptedSession,
    });
    this.circuitBreaker = new CircuitBreakerService({
      threshold: config.circuitBreakerThreshold,
      resetTimeoutMs: config.circuitBreakerResetMs,
    });
  }

  async start(): Promise<void> {
    const redisUrl = new URL(this.config.redisUrl);
    const connection = {
      host: redisUrl.hostname,
      port: parseInt(redisUrl.port || '6379', 10),
      password: redisUrl.password || undefined,
      tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
    };

    this.worker = new Worker(
      CLIENT_QUEUE_NAME,
      async (job: Job) => {
        if (this.isShuttingDown) {
          console.log('[Worker] Shutting down — skipping job');
          return;
        }
        await processClientMessage(job, this.gramService, this.circuitBreaker);
      },
      {
        connection,
        concurrency: 1,
        limiter: { max: 1, duration: 60000 },
      },
    );

    this.worker.on('completed', (job) => {
      console.log(`[Worker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
    });

    this.worker.on('error', (err) => {
      console.error('[Worker] Worker error:', err.message);
    });

    console.log(`[Worker] Started, listening on queue: ${CLIENT_QUEUE_NAME}`);
  }

  async stop(): Promise<void> {
    this.isShuttingDown = true;
    if (this.worker) {
      await this.worker.close();
      console.log('[Worker] BullMQ worker closed');
    }
    await this.gramService.disconnect();
    console.log('[Worker] Stopped gracefully');
  }
}
