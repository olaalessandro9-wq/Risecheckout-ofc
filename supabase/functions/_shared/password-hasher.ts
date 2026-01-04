/**
 * Password Hasher - Secure password hashing with bcrypt
 * 
 * Supports transparent migration from SHA-256 (v1) to bcrypt (v2)
 * Rise Protocol: Single responsibility, no external dependencies beyond std
 */

import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Hash versions
export const HASH_VERSION_SHA256 = 1;
export const HASH_VERSION_BCRYPT = 2;
export const CURRENT_HASH_VERSION = HASH_VERSION_BCRYPT;

// Bcrypt cost factor (10-12 is recommended for production)
const BCRYPT_COST = 10;

/**
 * Hash a password using bcrypt (current standard)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_COST);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 * Supports both SHA-256 (legacy) and bcrypt (current)
 */
export async function verifyPassword(
  password: string, 
  hash: string, 
  version: number = HASH_VERSION_BCRYPT
): Promise<boolean> {
  if (version === HASH_VERSION_SHA256) {
    // Legacy SHA-256 verification
    const legacyHash = await hashPasswordLegacy(password);
    return legacyHash === hash;
  }
  
  // Bcrypt verification
  return await bcrypt.compare(password, hash);
}

/**
 * Legacy SHA-256 hash (for backwards compatibility only)
 * DO NOT use for new passwords
 */
export async function hashPasswordLegacy(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = Deno.env.get("BUYER_AUTH_SALT") || "rise_checkout_salt";
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Check if a password hash needs to be upgraded to bcrypt
 */
export function needsRehash(version: number): boolean {
  return version < CURRENT_HASH_VERSION;
}

/**
 * Rehash a password with the current algorithm (bcrypt)
 * Returns the new hash and version
 */
export async function rehashPassword(password: string): Promise<{ hash: string; version: number }> {
  const hash = await hashPassword(password);
  return { hash, version: CURRENT_HASH_VERSION };
}
