/**
 * Hash helpers for students-invite Edge Function
 * RISE V3 Compliant
 */

import { genSaltSync, hashSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function hashPassword(password: string): string {
  const salt = genSaltSync(10);
  return hashSync(password, salt);
}
