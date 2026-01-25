import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-ctr';
  private readonly key: Buffer;

  constructor() {
    // In production, ENCRYPTION_KEY must be set to a secure 32-byte hex string
    const envKey = process.env.ENCRYPTION_KEY;
    if (!envKey) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    
    // Validate key length
    const keyBuffer = Buffer.from(envKey, 'hex');
    if (keyBuffer.length !== 32) {
      throw new Error(
        'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    
    this.key = keyBuffer;
  }

  async encrypt(text: string): Promise<string> {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  async decrypt(hash: string): Promise<string> {
    const [ivHex, contentHex] = hash.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const content = Buffer.from(contentHex, 'hex');
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    const decrypted = Buffer.concat([
      decipher.update(content),
      decipher.final(),
    ]);
    return decrypted.toString();
  }

  // Helper to encrypt a JSON object
  async encryptObject(data: any): Promise<any> {
    const jsonString = JSON.stringify(data);
    const encryptedString = await this.encrypt(jsonString);
    return { _encrypted: encryptedString };
  }

  // Helper to decrypt to a JSON object
  async decryptObject(data: any): Promise<any> {
    if (!data || !data._encrypted) return data; // Return as is if not encrypted
    const decryptedString = await this.decrypt(data._encrypted);
    return JSON.parse(decryptedString);
  }
}
