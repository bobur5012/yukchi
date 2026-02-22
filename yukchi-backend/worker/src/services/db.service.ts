import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export async function logTelegramMessage(params: {
  phone: string;
  message: string;
  status: string;
  messageId?: string;
  error?: string;
  floodWaitSeconds?: number;
}): Promise<void> {
  const db = getPool();
  try {
    await db.query(
      `INSERT INTO telegram_message_log (phone, message, message_id, status, error, flood_wait_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.phone,
        params.message,
        params.messageId || null,
        params.status,
        params.error || null,
        params.floodWaitSeconds || null,
      ],
    );
  } catch (err) {
    console.error('[DBService] Failed to log telegram message:', (err as Error).message);
  }
}

export async function updateNotificationLog(
  id: string,
  status: string,
  error?: string,
): Promise<void> {
  const db = getPool();
  try {
    await db.query(
      `UPDATE notification_log SET status = $1, error = $2, updated_at = NOW()
       WHERE id = $3`,
      [status, error || null, id],
    );
  } catch (err) {
    console.error('[DBService] Failed to update notification log:', (err as Error).message);
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
