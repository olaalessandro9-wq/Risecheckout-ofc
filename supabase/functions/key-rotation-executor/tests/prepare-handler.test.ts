/**
 * Prepare Handler Tests for key-rotation-executor
 * 
 * @module key-rotation-executor/tests/prepare-handler.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validatePrepare, getKeyIdentifier, checkEnvVar } from "./_shared.ts";

// ============================================================================
// PREPARE HANDLER TESTS
// ============================================================================

Deno.test("Prepare validation - should require version >= 2", () => {
  assertEquals(validatePrepare({ newVersion: 1 }).valid, false);
  assertEquals(validatePrepare({ newVersion: 0 }).valid, false);
  assertEquals(validatePrepare({ newVersion: 2 }).valid, true);
  assertEquals(validatePrepare({ newVersion: 5 }).valid, true);
});

Deno.test("Prepare validation - error message format", () => {
  const result = validatePrepare({ newVersion: 1 });
  assertEquals(result.valid, false);
  assertEquals(result.error, "Invalid version. Must be >= 2");
});

Deno.test("Prepare - should generate key identifier", () => {
  assertEquals(getKeyIdentifier(2), "BUYER_ENCRYPTION_KEY_V2");
  assertEquals(getKeyIdentifier(3, "CUSTOM_KEY_V3"), "CUSTOM_KEY_V3");
});

Deno.test("Prepare - key identifier follows pattern", () => {
  for (let v = 2; v <= 10; v++) {
    const key = getKeyIdentifier(v);
    assertEquals(key, `BUYER_ENCRYPTION_KEY_V${v}`);
  }
});

Deno.test("Prepare - should verify environment variable exists", () => {
  const withKey = { "BUYER_ENCRYPTION_KEY_V2": "secret-key" };
  const withoutKey = {};

  assertEquals(checkEnvVar(2, withKey).exists, true);
  assertEquals(checkEnvVar(2, withoutKey).exists, false);
  assertExists(checkEnvVar(2, withoutKey).hint);
});

Deno.test("Prepare - hint includes env var name", () => {
  const result = checkEnvVar(3, {});
  assertEquals(result.exists, false);
  assertEquals(result.hint?.includes("BUYER_ENCRYPTION_KEY_V3"), true);
});
