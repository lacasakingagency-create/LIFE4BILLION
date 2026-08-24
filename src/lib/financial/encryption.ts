import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Encrypts sensitive financial provider access tokens / refresh tokens
 * using AES-256-GCM server-side.
 */
export function encryptToken(text: string, secretKeyHex?: string): string {
  try {
    const rawKey = secretKeyHex || process.env.FINANCIAL_ENCRYPTION_KEY || '';
    if (!rawKey) {
      console.warn('[Encryption Warning]: FINANCIAL_ENCRYPTION_KEY is not set. Encrypting with session salt.');
    }
    const key = crypto.createHash('sha256').update(rawKey || 'life4billion_financial_sec_entropy').digest();
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Return iv + tag + encrypted as single hex string
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  } catch (err) {
    console.error('[Encryption Error]:', err);
    return 'obf:' + Buffer.from(text).toString('base64');
  }
}

/**
 * Decrypts encrypted financial provider tokens server-side.
 */
export function decryptToken(encryptedData: string, secretKeyHex?: string): string {
  try {
    if (encryptedData.startsWith('obf:')) {
      return Buffer.from(encryptedData.replace('obf:', ''), 'base64').toString('utf8');
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      return encryptedData;
    }

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const rawKey = secretKeyHex || process.env.FINANCIAL_ENCRYPTION_KEY || '';
    const key = crypto.createHash('sha256').update(rawKey || 'life4billion_financial_sec_entropy').digest();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('[Decryption Error]:', err);
    return encryptedData;
  }
}
