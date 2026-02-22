import 'dotenv/config';
import { TelegramWorker } from './worker';
import { closePool } from './services/db.service';

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

async function main() {
  console.log('[Main] Starting Yukchi Telegram Worker...');

  const redisUrl = getRequiredEnv('REDIS_URL');
  const appId = parseInt(getRequiredEnv('TELEGRAM_APP_ID'), 10);
  const appHash = getRequiredEnv('TELEGRAM_APP_HASH');
  const encryptionKey = getRequiredEnv('SESSION_ENCRYPTION_KEY');
  const encryptedSession = process.env.TELEGRAM_ENCRYPTED_SESSION;

  const worker = new TelegramWorker({
    redisUrl,
    appId,
    appHash,
    encryptionKey,
    encryptedSession,
    circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5', 10),
    circuitBreakerResetMs: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS || '300000', 10),
  });

  await worker.start();

  const gracefulShutdown = async (signal: string) => {
    console.log(`[Main] Received ${signal} — shutting down gracefully...`);
    await worker.stop();
    await closePool();
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    console.error('[Main] Uncaught exception:', err);
    gracefulShutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[Main] Unhandled rejection:', reason);
  });
}

main().catch((err) => {
  console.error('[Main] Fatal error:', err);
  process.exit(1);
});
