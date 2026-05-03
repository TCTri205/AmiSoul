import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

export class EncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // Standard for GCM
  private static readonly AUTH_TAG_LENGTH = 16;

  /**
   * Encrypts text using AES-256-GCM
   * Returns a string in format: iv:authTag:encryptedText
   */
  static encrypt(text: string, key: string): string {
    if (!text) return text;
    
    // Ensure key is 32 bytes
    const derivedKey = scryptSync(key, 'salt', 32);
    const iv = randomBytes(this.IV_LENGTH);
    const cipher = createCipheriv(this.ALGORITHM, derivedKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts text using AES-256-GCM
   * Expects format: iv:authTag:encryptedText
   */
  static decrypt(encryptedData: string, key: string): string {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData;

    try {
      const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
      
      const derivedKey = scryptSync(key, 'salt', 32);
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = createDecipheriv(this.ALGORITHM, derivedKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // If decryption fails, it might be unencrypted data or wrong key
      return encryptedData;
    }
  }
}
