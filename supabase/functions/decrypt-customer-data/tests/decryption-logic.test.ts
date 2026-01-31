/**
 * Decryption Logic Tests for decrypt-customer-data
 * 
 * @module decrypt-customer-data/tests/decryption-logic.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { decryptValue, deriveKeyHash } from "./_shared.ts";

// ============================================================================
// DECRYPTION TESTS
// ============================================================================

Deno.test("Decryption - should handle empty string", async () => {
  assertEquals(await decryptValue(""), null);
  assertEquals(await decryptValue("  "), null);
});

Deno.test("Decryption - should return value for non-empty", async () => {
  assertEquals(await decryptValue("plain-text"), "plain-text");
});

// ============================================================================
// KEY DERIVATION TESTS
// ============================================================================

Deno.test("Key derivation - should produce consistent hash", async () => {
  const hash1 = await deriveKeyHash("test-key");
  const hash2 = await deriveKeyHash("test-key");
  
  assertEquals(hash1, hash2);
  assertEquals(hash1.length, 64); // SHA-256 = 32 bytes = 64 hex chars
});

Deno.test("Key derivation - different keys produce different hashes", async () => {
  const hash1 = await deriveKeyHash("key-1");
  const hash2 = await deriveKeyHash("key-2");
  
  assertEquals(hash1 !== hash2, true);
});

Deno.test("Key derivation - empty key produces valid hash", async () => {
  const hash = await deriveKeyHash("");
  assertEquals(hash.length, 64);
});
