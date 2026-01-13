/**
 * Buyer Auth Password Utilities
 * 
 * Funções de hash e verificação de senhas
 * Extraído de buyer-auth-handlers.ts para manter < 300 linhas
 */

import { genSaltSync, hashSync, compareSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

import {
  HASH_VERSION_SHA256,
  CURRENT_HASH_VERSION,
  BCRYPT_COST,
} from "./buyer-auth-types.ts";

// ============================================
// PASSWORD HASHING
// ============================================

/**
 * Hash password using bcrypt (current method)
 */
export function hashPassword(password: string): string {
  const salt = genSaltSync(BCRYPT_COST);
  return hashSync(password, salt);
}

/**
 * Hash password using SHA-256 (legacy method - for migration only)
 */
async function hashPasswordLegacy(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = Deno.env.get("BUYER_AUTH_SALT") || "rise_checkout_salt";
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify password against hash, supporting both legacy SHA-256 and bcrypt
 */
export async function verifyPassword(
  password: string, 
  hash: string, 
  version: number
): Promise<boolean> {
  if (version === HASH_VERSION_SHA256) {
    const legacyHash = await hashPasswordLegacy(password);
    return legacyHash === hash;
  }
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

// ============================================
// RESPONSE HELPERS
// ============================================

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse(
  data: unknown, 
  status = 200, 
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
