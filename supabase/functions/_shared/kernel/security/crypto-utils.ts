/**
 * Cryptographic Utilities
 * 
 * Secure code generation for affiliate codes, tokens, and identifiers.
 * Uses Web Crypto API for cryptographically secure random values.
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Single Source of Truth
 * @module kernel/security/crypto-utils
 */

// ============================================
// AFFILIATE CODE GENERATION
// ============================================

/**
 * Generates a cryptographically secure affiliate code.
 * 
 * Format: AFF-XXXXXXXX-XXXXXXXX (uppercase hex)
 * Total entropy: 96 bits (12 random bytes)
 * 
 * @example
 * const code = generateSecureAffiliateCode();
 * // Returns: "AFF-1A2B3C4D-5E6F7A8B"
 * 
 * @returns Unique affiliate code with prefix
 */
export function generateSecureAffiliateCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `AFF-${hex.slice(0, 8)}-${hex.slice(8, 16)}`;
}

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generates a cryptographically secure hex token.
 * 
 * @param length - Number of random bytes (default: 32, produces 64 hex chars)
 * @returns Hex-encoded random token
 * 
 * @example
 * const token = generateSecureToken(16);
 * // Returns: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" (32 hex chars)
 */
export function generateSecureToken(length: number = 32): string {
  if (length < 1 || length > 256) {
    throw new Error("Token length must be between 1 and 256 bytes");
  }
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ============================================
// PREFIXED ID GENERATION
// ============================================

/**
 * Generates a secure identifier with a custom prefix.
 * 
 * @param prefix - Prefix for the identifier (e.g., "ORD", "TXN", "USR")
 * @param bytesCount - Number of random bytes (default: 8, produces 16 hex chars)
 * @returns Prefixed identifier
 * 
 * @example
 * const orderId = generateSecureId("ORD", 8);
 * // Returns: "ORD-A1B2C3D4E5F6A7B8"
 */
export function generateSecureId(prefix: string, bytesCount: number = 8): string {
  if (!prefix || prefix.length === 0) {
    throw new Error("Prefix is required");
  }
  if (bytesCount < 4 || bytesCount > 32) {
    throw new Error("Bytes count must be between 4 and 32");
  }
  const bytes = new Uint8Array(bytesCount);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `${prefix.toUpperCase()}-${hex}`;
}

// ============================================
// URL-SAFE TOKEN GENERATION
// ============================================

/**
 * Generates a URL-safe base64 token.
 * 
 * @param length - Number of random bytes (default: 32)
 * @returns URL-safe base64-encoded token
 * 
 * @example
 * const token = generateUrlSafeToken(24);
 * // Returns: "Qk9fX3NhZmVfdG9rZW4..." (URL-safe base64)
 */
export function generateUrlSafeToken(length: number = 32): string {
  if (length < 1 || length > 256) {
    throw new Error("Token length must be between 1 and 256 bytes");
  }
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  
  // Convert to base64 and make URL-safe
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
