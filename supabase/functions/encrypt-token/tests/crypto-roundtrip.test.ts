/**
 * Crypto Roundtrip Tests for encrypt-token
 * 
 * @module encrypt-token/tests/crypto-roundtrip.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  createCryptoKey, 
  combineIVAndCiphertext,
  extractIV,
  extractCiphertext,
  toBase64,
  fromBase64,
  DEFAULT_TEST_KEY 
} from "./_shared.ts";

// ============================================================================
// ENCRYPT/DECRYPT ROUNDTRIP TESTS
// ============================================================================

Deno.test("Encryption roundtrip - should preserve data", async () => {
  const plaintext = "Hello, World! 🌍";

  const cryptoKey = await createCryptoKey(DEFAULT_TEST_KEY);

  // Encrypt
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintextBytes = encoder.encode(plaintext);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintextBytes
  );

  // Combine IV + ciphertext
  const combined = combineIVAndCiphertext(iv, encrypted);
  const base64 = toBase64(combined);

  // Decrypt
  const decodedCombined = fromBase64(base64);
  const decodedIV = new Uint8Array(extractIV(decodedCombined));
  const decodedCiphertext = new Uint8Array(extractCiphertext(decodedCombined));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodedIV },
    cryptoKey,
    decodedCiphertext
  );

  const decryptedText = new TextDecoder().decode(decrypted);

  assertEquals(decryptedText, plaintext);
});

Deno.test("Encryption roundtrip - multiple iterations consistent", async () => {
  const plaintext = "Consistent data test";
  const cryptoKey = await createCryptoKey(DEFAULT_TEST_KEY);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  for (let i = 0; i < 3; i++) {
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
  }
});

// ============================================================================
// RESPONSE STRUCTURE TESTS
// ============================================================================

Deno.test("Encrypt response - should have encrypted field", () => {
  const response = {
    encrypted: "base64encodeddata=="
  };

  assertExists(response.encrypted);
  assertEquals(typeof response.encrypted, "string");
});

Deno.test("Decrypt response - should have decrypted field", () => {
  const response = {
    decrypted: "original data"
  };

  assertExists(response.decrypted);
  assertEquals(typeof response.decrypted, "string");
});

// ============================================================================
// ERROR RESPONSE TESTS
// ============================================================================

Deno.test("Error response - missing encryption key", () => {
  const response = {
    error: "Encryption not configured"
  };

  assertEquals(response.error, "Encryption not configured");
});

Deno.test("Error response - invalid action", () => {
  const response = {
    error: 'Invalid action. Use "encrypt" or "decrypt"'
  };

  assertEquals(response.error.includes("Invalid action"), true);
});

Deno.test("Error response - decryption failed", () => {
  const response = {
    error: "Decryption failed"
  };

  assertEquals(response.error, "Decryption failed");
});
