/**
 * MFA Helpers - TOTP Encryption & Verification
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Provides AES-256-GCM encryption for TOTP secrets,
 * TOTP code generation/verification, and backup code management.
 * 
 * Security:
 * - TOTP secret encrypted at rest with MFA_ENCRYPTION_KEY
 * - Backup codes stored as bcrypt hashes (cost 10)
 * - Secret never exposed to frontend
 * - Window ±1 step (30s) for clock drift tolerance
 * 
 * @module _shared/mfa-helpers
 * @version 1.0.0
 */

import { createLogger } from "./logger.ts";
import {
  genSaltSync,
  hashSync,
  compareSync,
} from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { TOTP, Secret } from "https://esm.sh/otpauth@9.3.5";

const log = createLogger("MFA-Helpers");

// ============================================================================
// CONSTANTS
// ============================================================================

const MFA_ISSUER = "RiseCheckout";
const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = "SHA1";
const TOTP_WINDOW = 1;

const BACKUP_CODE_LENGTH = 8;
const BACKUP_CODE_COUNT = 8;
const BCRYPT_COST = 10;

// Excludes confusing characters: I, O, 0, 1
const BACKUP_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// ============================================================================
// ENCRYPTION KEY
// ============================================================================

/**
 * Gets the MFA encryption key from environment.
 * 
 * Validates:
 * 1. Secret exists in environment
 * 2. Base64 format (length multiple of 4, valid charset)
 * 3. Successful base64 decoding
 * 4. Exact 32-byte output (AES-256 requirement)
 * 
 * Every error message includes the generation command so operators
 * can self-service without searching documentation.
 * 
 * @throws Error with actionable message if key is missing, malformed, or wrong size
 */
function getMfaEncryptionKey(): Uint8Array {
  const GENERATION_HINT = "Generate with: openssl rand -base64 32";

  const keyBase64 = Deno.env.get("MFA_ENCRYPTION_KEY");
  if (!keyBase64) {
    throw new Error(
      `MFA_ENCRYPTION_KEY not configured. ${GENERATION_HINT}`
    );
  }

  // Trim whitespace (prevents copy-paste accidents with trailing newlines/spaces)
  const trimmed = keyBase64.trim();

  // Validate base64 format BEFORE attempting decode
  // - Length must be multiple of 4
  // - Only valid base64 characters (A-Z, a-z, 0-9, +, /) with up to 2 trailing '='
  if (trimmed.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(trimmed)) {
    throw new Error(
      `MFA_ENCRYPTION_KEY is not valid base64 (length ${trimmed.length}, ` +
      `must be multiple of 4 with valid charset). ${GENERATION_HINT}`
    );
  }

  // Defense-in-depth: catch any remaining decode failures
  let keyBytes: Uint8Array;
  try {
    keyBytes = Uint8Array.from(atob(trimmed), (c) => c.charCodeAt(0));
  } catch {
    throw new Error(
      `MFA_ENCRYPTION_KEY failed base64 decoding. ${GENERATION_HINT}`
    );
  }

  // AES-256-GCM requires exactly 32 bytes (256 bits)
  if (keyBytes.length !== 32) {
    throw new Error(
      `MFA_ENCRYPTION_KEY must decode to exactly 32 bytes ` +
      `(got ${keyBytes.length}). ${GENERATION_HINT}`
    );
  }

  return keyBytes;
}

/**
 * Creates a CryptoKey from raw key material for AES-GCM.
 */
async function createCryptoKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

// ============================================================================
// AES-256-GCM ENCRYPTION
// ============================================================================

/**
 * Encrypts a TOTP secret using AES-256-GCM.
 * Returns encrypted data and IV as base64 strings.
 */
export async function encryptTotpSecret(
  secret: string
): Promise<{ encrypted: string; iv: string }> {
  const keyBytes = getMfaEncryptionKey();
  const cryptoKey = await createCryptoKey(keyBytes);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(secret);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    data
  );

  const encrypted = btoa(
    String.fromCharCode(...new Uint8Array(encryptedBuffer))
  );
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return { encrypted, iv: ivBase64 };
}

/**
 * Decrypts a TOTP secret using AES-256-GCM.
 */
export async function decryptTotpSecret(
  encryptedBase64: string,
  ivBase64: string
): Promise<string> {
  const keyBytes = getMfaEncryptionKey();
  const cryptoKey = await createCryptoKey(keyBytes);

  const encrypted = Uint8Array.from(atob(encryptedBase64), (c) =>
    c.charCodeAt(0)
  );
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encrypted
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// ============================================================================
// TOTP OPERATIONS
// ============================================================================

/**
 * Generates a new random TOTP secret (base32 encoded).
 */
export function generateTotpSecret(): string {
  const secret = new Secret({ size: 20 });
  return secret.base32;
}

/**
 * Generates the otpauth:// URI for QR code scanning.
 * Compatible with Google Authenticator, Authy, etc.
 */
export function generateOtpAuthUri(
  secretBase32: string,
  userEmail: string
): string {
  const totp = new TOTP({
    issuer: MFA_ISSUER,
    label: userEmail,
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: Secret.fromBase32(secretBase32),
  });

  return totp.toString();
}

/**
 * Verifies a TOTP code against a secret.
 * Allows ±1 step window (30s) for clock drift tolerance.
 *
 * @returns true if code is valid within the window
 */
export function verifyTotpCode(secretBase32: string, code: string): boolean {
  const totp = new TOTP({
    issuer: MFA_ISSUER,
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: Secret.fromBase32(secretBase32),
  });

  const delta = totp.validate({ token: code, window: TOTP_WINDOW });
  return delta !== null;
}

// ============================================================================
// BACKUP CODES
// ============================================================================

/**
 * Generates random alphanumeric backup codes.
 * Uses charset without confusing characters (I, O, 0, 1).
 */
export function generateBackupCodes(count = BACKUP_CODE_COUNT): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(BACKUP_CODE_LENGTH));
    let code = "";
    for (const byte of bytes) {
      code += BACKUP_CODE_CHARSET[byte % BACKUP_CODE_CHARSET.length];
    }
    codes.push(code);
  }

  return codes;
}

/**
 * Hashes a backup code using bcrypt.
 */
export function hashBackupCode(code: string): string {
  const salt = genSaltSync(BCRYPT_COST);
  return hashSync(code.toUpperCase(), salt);
}

/**
 * Verifies a backup code against an array of hashes.
 * @returns the index of the matching hash, or -1 if no match
 */
export function verifyBackupCode(code: string, hashes: string[]): number {
  const normalizedCode = code.toUpperCase();

  for (let i = 0; i < hashes.length; i++) {
    try {
      if (compareSync(normalizedCode, hashes[i])) {
        return i;
      }
    } catch {
      continue;
    }
  }

  return -1;
}
