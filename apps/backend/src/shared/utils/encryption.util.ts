import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

const ALGORITHM = 'aes-256-ctr';
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'kushim-secret-key-32-chars-at-least'; // Should be 32 chars

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.substring(0, 32)),
    iv,
  );
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(hash: string): string {
  const [iv, content] = hash.split(':');
  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.substring(0, 32)),
    Buffer.from(iv, 'hex'),
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(content, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString();
}
