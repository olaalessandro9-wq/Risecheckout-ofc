/**
 * Base64 Encoding Tests for encrypt-token
 * 
 * @module encrypt-token/tests/base64-encoding.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  toBase64, 
  fromBase64, 
  extractIV, 
  extractCiphertext, 
  combineIVAndCiphertext 
} from "./_shared.ts";

// ============================================================================
// BASE64 ENCODING TESTS
// ============================================================================

Deno.test("Base64 - should encode Uint8Array", () => {
  const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
  const base64 = toBase64(data);
  
  assertEquals(base64, "SGVsbG8=");
});

Deno.test("Base64 - should decode to Uint8Array", () => {
  const base64 = "SGVsbG8=";
  const decoded = fromBase64(base64);
  
  assertEquals(decoded.length, 5);
  assertEquals(decoded[0], 72); // 'H'
});

Deno.test("Base64 - roundtrip should preserve data", () => {
  const original = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128]);
  const base64 = toBase64(original);
  const decoded = fromBase64(base64);
  
  assertEquals(decoded.length, original.length);
  for (let i = 0; i < original.length; i++) {
    assertEquals(decoded[i], original[i]);
  }
});

// ============================================================================
// IV GENERATION TESTS
// ============================================================================

Deno.test("IV generation - should be 12 bytes", () => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  assertEquals(iv.length, 12);
});

Deno.test("IV generation - should be random", () => {
  const iv1 = crypto.getRandomValues(new Uint8Array(12));
  const iv2 = crypto.getRandomValues(new Uint8Array(12));
  
  const str1 = Array.from(iv1).join(',');
  const str2 = Array.from(iv2).join(',');
  
  assertNotEquals(str1, str2);
});

// ============================================================================
// COMBINED IV + CIPHERTEXT TESTS
// ============================================================================

Deno.test("Combined format - IV should be first 12 bytes", () => {
  const iv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const ciphertext = new Uint8Array([100, 101, 102, 103, 104]);
  
  const combined = combineIVAndCiphertext(iv, ciphertext.buffer);

  const extractedIV = extractIV(combined);
  const extractedCiphertext = extractCiphertext(combined);

  assertEquals(extractedIV.length, 12);
  assertEquals(extractedCiphertext.length, 5);
  assertEquals(extractedIV[0], 1);
  assertEquals(extractedCiphertext[0], 100);
});

Deno.test("Combined format - roundtrip preserves structure", () => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array([10, 20, 30, 40, 50]);
  
  const combined = combineIVAndCiphertext(iv, data.buffer);
  const base64 = toBase64(combined);
  const decoded = fromBase64(base64);
  
  const recoveredIV = extractIV(decoded);
  const recoveredData = extractCiphertext(decoded);
  
  assertEquals(Array.from(recoveredIV), Array.from(iv));
  assertEquals(Array.from(recoveredData), Array.from(data));
});
