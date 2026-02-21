import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "Missing GOOGLE_TOKEN_ENCRYPTION_KEY. " +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }
  return Buffer.from(key, "base64");
}

export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp (ms)
  token_type: string;
}

/**
 * Szyfruje tokeny OAuth do zapisu w bazie danych.
 * Format: base64(iv + ciphertext + authTag)
 */
export function encryptTokens(tokens: GoogleOAuthTokens): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(tokens);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // iv (12) + encrypted (N) + authTag (16)
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return combined.toString("base64");
}

/**
 * Odszyfrowuje tokeny OAuth z bazy danych.
 */
export function decryptTokens(encryptedData: string): GoogleOAuthTokens {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, "base64");

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}
