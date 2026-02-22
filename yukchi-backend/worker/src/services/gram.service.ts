import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram';
import { SessionService } from './session.service';

export interface GramServiceConfig {
  appId: number;
  appHash: string;
  sessionService: SessionService;
  encryptedSession?: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  floodWaitSeconds?: number;
}

export class GramService {
  private client: TelegramClient | null = null;
  private readonly config: GramServiceConfig;
  private isConnected = false;

  constructor(config: GramServiceConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    let sessionString = '';
    if (this.config.encryptedSession) {
      try {
        sessionString = this.config.sessionService.decrypt(this.config.encryptedSession);
      } catch (err) {
        console.error('[GramService] Failed to decrypt session:', (err as Error).message);
      }
    }

    const session = new StringSession(sessionString);
    this.client = new TelegramClient(session, this.config.appId, this.config.appHash, {
      connectionRetries: 3,
      requestRetries: 3,
      autoReconnect: true,
      retryDelay: 1000,
    });

    await this.client.connect();
    this.isConnected = true;
    console.log('[GramService] Connected to Telegram');
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log('[GramService] Disconnected from Telegram');
    }
  }

  async sendMessage(phone: string, message: string): Promise<SendMessageResult> {
    if (!this.client || !this.isConnected) {
      return { success: false, error: 'Client not connected' };
    }

    try {
      const result = await this.client.sendMessage(phone, { message });
      const messageId = result?.id?.toString();
      console.log(`[GramService] Message sent to ${phone}, messageId=${messageId}`);
      return { success: true, messageId };
    } catch (error: any) {
      const errorName = error?.constructor?.name || 'UnknownError';
      const errorMessage = error?.message || 'Unknown error';

      if (errorName === 'FloodWaitError' || errorMessage.includes('FLOOD_WAIT')) {
        const seconds = error.seconds || 60;
        console.warn(`[GramService] FloodWait for ${seconds}s`);
        return { success: false, error: 'FLOOD_WAIT', floodWaitSeconds: seconds };
      }

      if (errorName === 'PeerFloodError' || errorMessage.includes('PEER_FLOOD')) {
        console.error('[GramService] PeerFlood — stopping worker');
        return { success: false, error: 'PEER_FLOOD' };
      }

      if (errorMessage.includes('USER_PRIVACY_RESTRICTED')) {
        return { success: false, error: 'PRIVACY_RESTRICTED' };
      }

      console.error(`[GramService] Error sending to ${phone}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }
}
