/**
 * Key Handling Tests for encrypt-token
 * 
 * @module encrypt-token/tests/key-handling.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { padKey, createCryptoKey, TEST_KEY_32_CHARS } from "./_shared.ts";

// ============================================================================
// KEY PADDING TESTS
// ============================================================================

Deno.test("Encryption key - should pad to 32 characters", () => {
  assertEquals(padKey("short").length, 32);
  assertEquals(padKey("short"), "short" + "0".repeat(27));
});

Deno.test("Encryption key - should truncate long keys", () => {
  const longKey = "a".repeat(50);
  assertEquals(padKey(longKey).length, 32);
  assertEquals(padKey(longKey), "a".repeat(32));
});

Deno.test("Encryption key - exact 32 chars unchanged", () => {
  const exactKey = "x".repeat(32);
  assertEquals(padKey(exactKey), exactKey);
});

Deno.test("Encryption key - empty string pads correctly", () => {
  assertEquals(padKey("").length, 32);
  assertEquals(padKey(""), "0".repeat(32));
});

// ============================================================================
// CRYPTO KEY IMPORT TESTS
// ============================================================================

Deno.test("Crypto key import - should create AES-GCM key", async () => {
  const cryptoKey = await createCryptoKey(TEST_KEY_32_CHARS);

  assertExists(cryptoKey);
  assertEquals(cryptoKey.algorithm.name, "AES-GCM");
  assertEquals(cryptoKey.extractable, false);
});

Deno.test("Crypto key import - with encrypt only usage", async () => {
  const cryptoKey = await createCryptoKey(TEST_KEY_32_CHARS, ['encrypt']);

  assertExists(cryptoKey);
  assertEquals(cryptoKey.usages.includes('encrypt'), true);
  assertEquals(cryptoKey.usages.includes('decrypt'), false);
});

Deno.test("Crypto key import - with decrypt only usage", async () => {
  const cryptoKey = await createCryptoKey(TEST_KEY_32_CHARS, ['decrypt']);

  assertExists(cryptoKey);
  assertEquals(cryptoKey.usages.includes('decrypt'), true);
  assertEquals(cryptoKey.usages.includes('encrypt'), false);
});
