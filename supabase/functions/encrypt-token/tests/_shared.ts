/**
 * Shared Types & Helpers for encrypt-token Tests
 * 
 * @module encrypt-token/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TokenRequest {
  action?: string;
  data?: string;
}

export interface EncryptResponse {
  encrypted: string;
}

export interface DecryptResponse {
  decrypted: string;
}

export interface ErrorResponse {
  error: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALID_ACTIONS = ["encrypt", "decrypt"] as const;
export type ValidAction = typeof VALID_ACTIONS[number];

export const TEST_KEY_32_CHARS = "test-key-32-characters-exactly!!";
export const DEFAULT_TEST_KEY = "test-encryption-key-32-chars!!!";

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates a token request has required fields
 */
export function validateRequest(req: TokenRequest): { valid: boolean; error?: string } {
  if (!req.action || !req.data) {
    return { valid: false, error: "action and data are required" };
  }
  return { valid: true };
}

/**
 * Pads or truncates a key to exactly 32 characters
 */
export function padKey(key: string): string {
  return key.padEnd(32, '0').slice(0, 32);
}

// ============================================================================
// CRYPTO HELPERS
// ============================================================================

/**
 * Creates an AES-GCM crypto key from string material
 */
export async function createCryptoKey(
  keyMaterial: string,
  usages: KeyUsage[] = ['encrypt', 'decrypt']
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(padKey(keyMaterial));
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    usages
  );
}

/**
 * Extracts IV from combined IV+ciphertext buffer
 */
export function extractIV(combined: Uint8Array): Uint8Array {
  return combined.slice(0, 12);
}

/**
 * Extracts ciphertext from combined IV+ciphertext buffer
 */
export function extractCiphertext(combined: Uint8Array): Uint8Array {
  return combined.slice(12);
}

/**
 * Combines IV and ciphertext into a single buffer
 */
export function combineIVAndCiphertext(iv: Uint8Array, ciphertext: ArrayBuffer): Uint8Array {
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return combined;
}

/**
 * Encodes Uint8Array to base64
 */
export function toBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}

/**
 * Decodes base64 to Uint8Array
 */
export function fromBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
