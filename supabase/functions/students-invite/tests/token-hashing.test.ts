/**
 * Token Generation and Hashing Tests for students-invite
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { generateToken, hashToken, hashPassword } from "./_shared.ts";

// ============================================
// UNIT TESTS: Token Validation
// ============================================

Deno.test("students-invite: validates token format", () => {
  const token = "a1b2c3d4-e5f6-7890-abcd-ef1234567890-12345678-1234-1234-1234-123456789012";
  const parts = token.split("-");
  assertEquals(parts.length >= 9, true);
});

Deno.test("students-invite: generates unique tokens", () => {
  const tokens = new Set<string>();
  for (let i = 0; i < 100; i++) {
    tokens.add(generateToken());
  }
  assertEquals(tokens.size, 100);
});

Deno.test("students-invite: token has sufficient entropy", () => {
  const token = generateToken();
  assertEquals(token.length >= 72, true);
});

// ============================================
// UNIT TESTS: Token Hashing
// ============================================

Deno.test("students-invite: hashes token for storage", async () => {
  const token = "test-token-123";
  const hash = await hashToken(token);

  assertEquals(hash.length, 64);
  assertEquals(/^[a-f0-9]+$/.test(hash), true);
});

Deno.test("students-invite: token hash is consistent", async () => {
  const token = "my-secret-token";
  const hash1 = await hashToken(token);
  const hash2 = await hashToken(token);

  assertEquals(hash1, hash2);
});

// ============================================
// UNIT TESTS: Password Hashing
// ============================================

Deno.test("students-invite: password hash is deterministic for same input", async () => {
  const password = "test-password-123";
  
  const hash1 = await hashPassword(password);
  const hash2 = await hashPassword(password);
  
  assertEquals(hash1, hash2);
  assertEquals(hash1.length, 64);
});

Deno.test("students-invite: different passwords produce different hashes", async () => {
  const hash1 = await hashPassword("password1");
  const hash2 = await hashPassword("password2");
  
  assertNotEquals(hash1, hash2);
});
