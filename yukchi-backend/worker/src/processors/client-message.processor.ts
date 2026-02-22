import { Job } from 'bullmq';
import { GramService } from '../services/gram.service';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { logTelegramMessage, updateNotificationLog } from '../services/db.service';

const RATE_LIMIT_MS =
  (parseInt(process.env.RATE_LIMIT_MESSAGES_PER_MINUTE || '1', 10) === 0
    ? 60000
    : Math.floor(60000 / parseInt(process.env.RATE_LIMIT_MESSAGES_PER_MINUTE || '1', 10)));

let lastSentAt = 0;

export async function processClientMessage(
  job: Job,
  gramService: GramService,
  circuitBreaker: CircuitBreakerService,
): Promise<void> {
  const { phone, message, notificationLogId } = job.data;

  if (circuitBreaker.isOpen()) {
    console.warn(`[Processor] Circuit is OPEN — rejecting job ${job.id}`);
    throw new Error('Circuit breaker is OPEN — Telegram client suspended');
  }

  const now = Date.now();
  const timeSinceLast = now - lastSentAt;
  if (timeSinceLast < RATE_LIMIT_MS) {
    const delay = RATE_LIMIT_MS - timeSinceLast;
    console.log(`[Processor] Rate limiting — waiting ${delay}ms`);
    await sleep(delay);
  }

  if (!gramService.isClientConnected()) {
    await gramService.connect();
  }

  console.log(`[Processor] Sending message to ${phone} (job ${job.id})`);
  const result = await gramService.sendMessage(phone, message);
  lastSentAt = Date.now();

  if (result.success) {
    circuitBreaker.recordSuccess();
    await logTelegramMessage({
      phone,
      message,
      status: 'sent',
      messageId: result.messageId,
    });
    if (notificationLogId) {
      await updateNotificationLog(notificationLogId, 'sent');
    }
  } else {
    if (result.error === 'PEER_FLOOD') {
      for (let i = 0; i < 5; i++) circuitBreaker.recordFailure();
      await logTelegramMessage({ phone, message, status: 'failed', error: result.error });
      if (notificationLogId) {
        await updateNotificationLog(notificationLogId, 'failed', result.error);
      }
      throw new Error('PEER_FLOOD: circuit breaker triggered');
    }

    if (result.error === 'FLOOD_WAIT' && result.floodWaitSeconds) {
      await logTelegramMessage({
        phone,
        message,
        status: 'retrying',
        error: result.error,
        floodWaitSeconds: result.floodWaitSeconds,
      });
      await sleep(result.floodWaitSeconds * 1000);
      throw new Error(`FLOOD_WAIT_${result.floodWaitSeconds}`);
    }

    if (result.error === 'PRIVACY_RESTRICTED') {
      await logTelegramMessage({ phone, message, status: 'failed', error: result.error });
      if (notificationLogId) {
        await updateNotificationLog(notificationLogId, 'failed', result.error);
      }
      return;
    }

    circuitBreaker.recordFailure();
    await logTelegramMessage({ phone, message, status: 'failed', error: result.error });
    if (notificationLogId) {
      await updateNotificationLog(notificationLogId, 'failed', result.error);
    }
    throw new Error(result.error || 'Unknown error');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
