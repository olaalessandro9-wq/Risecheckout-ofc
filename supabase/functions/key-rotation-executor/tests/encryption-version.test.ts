/**
 * Encryption Version Tests for key-rotation-executor
 * 
 * @module key-rotation-executor/tests/encryption-version.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isEncrypted, getEncryptedVersion, formatError } from "./_shared.ts";

// ============================================================================
// ENCRYPTED VALUE DETECTION TESTS
// ============================================================================

Deno.test("Encrypted value detection - should identify versioned format", () => {
  assertEquals(isEncrypted("v1:abc123=="), true);
  assertEquals(isEncrypted("v2:xyz789=="), true);
  assertEquals(isEncrypted("plain text"), false);
  assertEquals(isEncrypted(""), false);
});

Deno.test("Encrypted value detection - edge cases", () => {
  assertEquals(isEncrypted("v:noversion"), true); // Has v and :
  assertEquals(isEncrypted("version1:data"), true); // Starts with v and has : (matches current logic)
  assertEquals(isEncrypted("v1"), false); // No colon
  assertEquals(isEncrypted("V1:data"), false); // Uppercase V - no lowercase v start
});

Deno.test("Encrypted version extraction - should parse version number", () => {
  assertEquals(getEncryptedVersion("v1:data"), 1);
  assertEquals(getEncryptedVersion("v2:data"), 2);
  assertEquals(getEncryptedVersion("v10:data"), 10);
  assertEquals(getEncryptedVersion("plain"), null);
  assertEquals(getEncryptedVersion(""), null);
});

Deno.test("Encrypted version extraction - handles large versions", () => {
  assertEquals(getEncryptedVersion("v100:data"), 100);
  assertEquals(getEncryptedVersion("v999:data"), 999);
});

Deno.test("Encrypted version extraction - invalid formats return null", () => {
  assertEquals(getEncryptedVersion("vX:data"), null);
  assertEquals(getEncryptedVersion("version1:data"), null);
  assertEquals(getEncryptedVersion("1:data"), null);
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test("Error handling - should format error message", () => {
  assertEquals(formatError(new Error("Test error")), "Test error");
  assertEquals(formatError("String error"), "String error");
  assertEquals(formatError(123), "123");
});

Deno.test("Error handling - null and undefined", () => {
  assertEquals(formatError(null), "null");
  assertEquals(formatError(undefined), "undefined");
});

Deno.test("Error handling - object to string", () => {
  const result = formatError({ custom: "error" });
  assertEquals(result, "[object Object]");
});
