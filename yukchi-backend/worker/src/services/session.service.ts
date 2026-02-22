import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export class SessionService {
  private readonly encryptionKey: Buffer;

  constructor(keyHex: string) {
    if (!keyHex || keyHex.length < 32) {
      throw new Error('SESSION_ENCRYPTION_KEY must be at least 32 hex characters (16 bytes)');
    }
    this.encryptionKey = Buffer.from(keyHex.slice(0, 64).padEnd(64, '0'), 'hex');
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decrypt(ciphertext: string): string {
    const data = Buffer.from(ciphertext, 'base64');
    const iv = data.slice(0, 16);
    const tag = data.slice(16, 32);
    const encrypted = data.slice(32);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }
}
