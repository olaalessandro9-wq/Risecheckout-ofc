/**
 * Buyer Auth Password Utilities
 * 
 * RISE V3: SHA-256 legacy ELIMINADO
 * Apenas bcrypt para hash de senhas
 * 
 * Constants imported from auth-constants.ts
 * Response helpers imported from response-helpers.ts
 */

import { genSaltSync, hashSync, compareSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { BCRYPT_COST } from "./auth-constants.ts";

// Re-export response helper for backwards compatibility
export { jsonResponse } from "./response-helpers.ts";

// ============================================
// PASSWORD HASHING (Apenas bcrypt)
// ============================================

/**
 * Hash password using bcrypt
 */
export function hashPassword(password: string): string {
  const salt = genSaltSync(BCRYPT_COST);
  return hashSync(password, salt);
}

/**
 * Verify password against bcrypt hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate cryptographically secure session token
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate cryptographically secure password reset token
 */
export function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}
