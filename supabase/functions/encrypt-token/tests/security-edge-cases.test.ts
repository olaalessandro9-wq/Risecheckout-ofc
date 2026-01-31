/**
 * Security & Edge Cases Tests for encrypt-token
 * 
 * @module encrypt-token/tests/security-edge-cases.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createCryptoKey, TEST_KEY_32_CHARS } from "./_shared.ts";

// ============================================================================
// EDGE CASES TESTS
// ============================================================================

Deno.test("Edge case - empty string encryption", async () => {
  const plaintext = "";
  const cryptoKey = await createCryptoKey(TEST_KEY_32_CHARS);
  const encoder = new TextEncoder();

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintextBytes = encoder.encode(plaintext);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintextBytes
  );

  // Empty string should still produce ciphertext (auth tag)
  assertEquals(encrypted.byteLength > 0, true);
});

Deno.test("Edge case - unicode string encryption", async () => {
  const plaintext = "日本語テスト 🎌 مرحبا";
  const cryptoKey = await createCryptoKey(TEST_KEY_32_CHARS);
  const encoder = new TextEncoder();

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintextBytes = encoder.encode(plaintext);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintextBytes
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );

  const decryptedText = new TextDecoder().decode(decrypted);

  assertEquals(decryptedText, plaintext);
});

Deno.test("Edge case - large data encryption", async () => {
  const plaintext = "x".repeat(10000);
  const cryptoKey = await createCryptoKey(TEST_KEY_32_CHARS);
  const encoder = new TextEncoder();

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintextBytes = encoder.encode(plaintext);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintextBytes
  );

  assertEquals(encrypted.byteLength > plaintext.length, true);
});

Deno.test("Edge case - special characters in data", async () => {
  const plaintext = "!@#$%^&*()_+-=[]{}|;':\",./<>?\n\t\r";
  const cryptoKey = await createCryptoKey(TEST_KEY_32_CHARS);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoder.encode(plaintext)
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );

  assertEquals(decoder.decode(decrypted), plaintext);
});

// ============================================================================
// SECURITY TESTS
// ============================================================================

Deno.test("Security - different plaintexts produce different ciphertexts", async () => {
  const cryptoKey = await createCryptoKey(TEST_KEY_32_CHARS, ['encrypt']);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted1 = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoder.encode("message1")
  );

  const encrypted2 = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoder.encode("message2")
  );

  const str1 = Array.from(new Uint8Array(encrypted1)).join(',');
  const str2 = Array.from(new Uint8Array(encrypted2)).join(',');

  assertNotEquals(str1, str2);
});

Deno.test("Security - same plaintext with different IVs produces different ciphertexts", async () => {
  const cryptoKey = await createCryptoKey(TEST_KEY_32_CHARS, ['encrypt']);
  const encoder = new TextEncoder();
  const plaintext = encoder.encode("same message");
  
  const iv1 = crypto.getRandomValues(new Uint8Array(12));
  const encrypted1 = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv1 },
    cryptoKey,
    plaintext
  );

  const iv2 = crypto.getRandomValues(new Uint8Array(12));
  const encrypted2 = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv2 },
    cryptoKey,
    plaintext
  );

  const str1 = Array.from(new Uint8Array(encrypted1)).join(',');
  const str2 = Array.from(new Uint8Array(encrypted2)).join(',');

  assertNotEquals(str1, str2);
});

Deno.test("Security - ciphertext length increases with plaintext", async () => {
  const cryptoKey = await createCryptoKey(TEST_KEY_32_CHARS, ['encrypt']);
  const encoder = new TextEncoder();
  
  const short = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
    cryptoKey,
    encoder.encode("short")
  );

  const longer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
    cryptoKey,
    encoder.encode("this is a much longer message")
  );

  assertEquals(longer.byteLength > short.byteLength, true);
});
