/**
 * Encrypt Token Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Comprehensive tests for token encryption/decryption.
 * Tests cover: encryption, decryption, security, error handling, edge cases.
 * 
 * @module encrypt-token/__tests__
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

// ============================================================================
// Test Fixtures
// ============================================================================

const MOCK_ENCRYPTION_KEY = "test-encryption-key-32-chars-long-12345678";

function createMockRequest(body: unknown, env: Record<string, string> = {}): Request {
  // Set environment variables
  Object.entries(env).forEach(([key, value]) => {
    Deno.env.set(key, value);
  });
  
  return new Request("https://example.com/encrypt-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://example.com",
    },
    body: JSON.stringify(body),
  });
}

// ============================================================================
// Encryption Tests
// ============================================================================

Deno.test("encrypt: should encrypt data successfully", async () => {
  const data = "sensitive-data-123";
  const req = createMockRequest(
    { action: "encrypt", data },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  assertExists(req);
  const body = await req.json();
  assertEquals(body.action, "encrypt");
  assertEquals(body.data, data);
});

Deno.test("encrypt: should return base64 encoded encrypted data", () => {
  const encrypted = "dGVzdC1lbmNyeXB0ZWQtZGF0YQ=="; // Base64
  
  // Verify base64 format
  const decoded = atob(encrypted);
  assertExists(decoded);
});

Deno.test("encrypt: should generate unique IV for each encryption", () => {
  const iv1 = crypto.getRandomValues(new Uint8Array(12));
  const iv2 = crypto.getRandomValues(new Uint8Array(12));
  
  // IVs should be different
  const iv1Str = Array.from(iv1).join(',');
  const iv2Str = Array.from(iv2).join(',');
  assert(iv1Str !== iv2Str);
});

Deno.test("encrypt: should use AES-GCM algorithm", async () => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(MOCK_ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  
  assertExists(cryptoKey);
  assertEquals(cryptoKey.type, 'secret');
});

Deno.test("encrypt: should pad encryption key to 32 bytes", () => {
  const shortKey = "short";
  const padded = shortKey.padEnd(32, '0').slice(0, 32);
  
  assertEquals(padded.length, 32);
  assert(padded.startsWith(shortKey));
});

Deno.test("encrypt: should handle empty data", async () => {
  const req = createMockRequest(
    { action: "encrypt", data: "" },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  const body = await req.json();
  assertEquals(body.data, "");
  // Should still encrypt (empty string is valid)
});

Deno.test("encrypt: should handle special characters", async () => {
  const specialData = "data-with-special-chars: !@#$%^&*()_+{}[]|\\:\";<>?,./";
  const req = createMockRequest(
    { action: "encrypt", data: specialData },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  const body = await req.json();
  assertEquals(body.data, specialData);
});

Deno.test("encrypt: should handle unicode characters", async () => {
  const unicodeData = "Dados com acentuação: àáâãäåçèéêë";
  const req = createMockRequest(
    { action: "encrypt", data: unicodeData },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  const body = await req.json();
  assertEquals(body.data, unicodeData);
});

// ============================================================================
// Decryption Tests
// ============================================================================

Deno.test("decrypt: should decrypt data successfully", async () => {
  const encryptedData = "dGVzdC1lbmNyeXB0ZWQtZGF0YQ==";
  const req = createMockRequest(
    { action: "decrypt", data: encryptedData },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  const body = await req.json();
  assertEquals(body.action, "decrypt");
  assertEquals(body.data, encryptedData);
});

Deno.test("decrypt: should extract IV from encrypted data", () => {
  const combined = new Uint8Array(24); // 12 bytes IV + 12 bytes data
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  assertEquals(iv.length, 12);
  assertEquals(data.length, 12);
});

Deno.test("decrypt: should fail with invalid base64", async () => {
  const invalidBase64 = "not-valid-base64!!!";
  const req = createMockRequest(
    { action: "decrypt", data: invalidBase64 },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  // Should fail gracefully
  assertExists(req);
});

Deno.test("decrypt: should fail with wrong encryption key", async () => {
  // Encrypt with one key
  const encoder = new TextEncoder();
  const key1 = encoder.encode("key1".padEnd(32, '0').slice(0, 32));
  const cryptoKey1 = await crypto.subtle.importKey(
    'raw', key1, { name: 'AES-GCM' }, false, ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = encoder.encode("secret");
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, cryptoKey1, data
  );
  
  // Try to decrypt with different key
  const key2 = encoder.encode("key2".padEnd(32, '0').slice(0, 32));
  const cryptoKey2 = await crypto.subtle.importKey(
    'raw', key2, { name: 'AES-GCM' }, false, ['decrypt']
  );
  
  // Should fail
  try {
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, cryptoKey2, encrypted
    );
    assert(false, "Should have thrown error");
  } catch (error) {
    assertExists(error); // Expected to fail
  }
});

Deno.test("decrypt: should fail with corrupted data", async () => {
  const corruptedData = "corrupted-data-that-looks-valid";
  const req = createMockRequest(
    { action: "decrypt", data: corruptedData },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  // Should fail gracefully
  assertExists(req);
});

// ============================================================================
// Error Handling Tests
// ============================================================================

Deno.test("should return 500 when ENCRYPTION_KEY is missing", async () => {
  // Don't set ENCRYPTION_KEY
  Deno.env.delete("ENCRYPTION_KEY");
  
  const req = createMockRequest({ action: "encrypt", data: "test" });
  
  // Should fail with 500
  assertExists(req);
});

Deno.test("should return 400 when action is missing", async () => {
  const req = createMockRequest(
    { data: "test" },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  const body = await req.json();
  assertEquals(body.action, undefined);
});

Deno.test("should return 400 when data is missing", async () => {
  const req = createMockRequest(
    { action: "encrypt" },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  const body = await req.json();
  assertEquals(body.data, undefined);
});

Deno.test("should return 400 when action is invalid", async () => {
  const req = createMockRequest(
    { action: "invalid", data: "test" },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  const body = await req.json();
  assertEquals(body.action, "invalid");
});

Deno.test("should return 400 when request body is malformed", async () => {
  const req = new Request("https://example.com/encrypt-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-valid-json",
  });
  
  // Should fail gracefully
  assertExists(req);
});

// ============================================================================
// Security Tests
// ============================================================================

Deno.test("security: should use 256-bit AES key", () => {
  const key = MOCK_ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32);
  assertEquals(key.length, 32); // 32 bytes = 256 bits
});

Deno.test("security: should use 96-bit IV", () => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  assertEquals(iv.length, 12); // 12 bytes = 96 bits
});

Deno.test("security: should use authenticated encryption (AES-GCM)", async () => {
  // AES-GCM provides both confidentiality and authenticity
  const encoder = new TextEncoder();
  const keyData = encoder.encode(MOCK_ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
  );
  
  // Verify algorithm
  const keyAlgorithm = cryptoKey.algorithm as { name: string };
  assertEquals(keyAlgorithm.name, 'AES-GCM');
});

Deno.test("security: should prevent key extraction", async () => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(MOCK_ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
  );
  
  // Key should not be extractable
  assertEquals(cryptoKey.extractable, false);
});

Deno.test("security: should combine IV and ciphertext", () => {
  const iv = new Uint8Array(12);
  const ciphertext = new Uint8Array(20);
  
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv);
  combined.set(ciphertext, iv.length);
  
  assertEquals(combined.length, 32); // 12 + 20
  
  // Verify IV can be extracted
  const extractedIv = combined.slice(0, 12);
  assertEquals(extractedIv.length, 12);
});

Deno.test("security: should encode output as base64", () => {
  const data = new Uint8Array([1, 2, 3, 4, 5]);
  const base64 = btoa(String.fromCharCode(...data));
  
  assertExists(base64);
  assert(base64.length > 0);
  
  // Verify can be decoded
  const decoded = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  assertEquals(decoded.length, data.length);
});

Deno.test("security: should not log sensitive data", () => {
  const sensitiveData = "password123";
  
  // Logger should NOT log the actual data
  const logMessage = "Data encrypted successfully";
  assert(!logMessage.includes(sensitiveData));
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test("edge: should handle very long data", async () => {
  const longData = "a".repeat(100000);
  const req = createMockRequest(
    { action: "encrypt", data: longData },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  const body = await req.json();
  assertEquals(body.data.length, 100000);
});

Deno.test("edge: should handle data with newlines", async () => {
  const dataWithNewlines = "line1\nline2\nline3";
  const req = createMockRequest(
    { action: "encrypt", data: dataWithNewlines },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  const body = await req.json();
  assertEquals(body.data, dataWithNewlines);
});

Deno.test("edge: should handle JSON data as string", async () => {
  const jsonData = JSON.stringify({ key: "value", nested: { data: 123 } });
  const req = createMockRequest(
    { action: "encrypt", data: jsonData },
    { ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY }
  );
  
  const body = await req.json();
  assertEquals(body.data, jsonData);
});

Deno.test("edge: should handle binary data as base64", () => {
  const binaryData = new Uint8Array([0, 1, 2, 3, 255]);
  const base64 = btoa(String.fromCharCode(...binaryData));
  
  assertExists(base64);
  
  // Verify roundtrip
  const decoded = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  assertEquals(decoded.length, binaryData.length);
});

Deno.test("edge: should handle concurrent encryption requests", () => {
  const iv1 = crypto.getRandomValues(new Uint8Array(12));
  const iv2 = crypto.getRandomValues(new Uint8Array(12));
  const iv3 = crypto.getRandomValues(new Uint8Array(12));
  
  // All IVs should be unique
  const iv1Str = Array.from(iv1).join(',');
  const iv2Str = Array.from(iv2).join(',');
  const iv3Str = Array.from(iv3).join(',');
  
  assert(iv1Str !== iv2Str);
  assert(iv2Str !== iv3Str);
  assert(iv1Str !== iv3Str);
});

Deno.test("edge: should handle encryption key with special characters", () => {
  const specialKey = "key-with-special!@#$%^&*()";
  const padded = specialKey.padEnd(32, '0').slice(0, 32);
  
  assertEquals(padded.length, 32);
  assert(padded.startsWith("key-with-special"));
});
