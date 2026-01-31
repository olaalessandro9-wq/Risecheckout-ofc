/**
 * Action Validation Tests for encrypt-token
 * 
 * @module encrypt-token/tests/action-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { VALID_ACTIONS, validateRequest } from "./_shared.ts";

// ============================================================================
// ACTION VALIDATION TESTS
// ============================================================================

Deno.test("Action validation - should accept 'encrypt'", () => {
  assertEquals(VALID_ACTIONS.includes("encrypt"), true);
});

Deno.test("Action validation - should accept 'decrypt'", () => {
  assertEquals(VALID_ACTIONS.includes("decrypt"), true);
});

Deno.test("Action validation - should reject invalid actions", () => {
  const actions = VALID_ACTIONS as readonly string[];
  
  assertEquals(actions.includes("encode"), false);
  assertEquals(actions.includes("hash"), false);
  assertEquals(actions.includes(""), false);
});

// ============================================================================
// REQUEST VALIDATION TESTS
// ============================================================================

Deno.test("Request validation - should require action and data", () => {
  assertEquals(validateRequest({}).valid, false);
  assertEquals(validateRequest({ action: "encrypt" }).valid, false);
  assertEquals(validateRequest({ data: "test" }).valid, false);
  assertEquals(validateRequest({ action: "encrypt", data: "test" }).valid, true);
});

Deno.test("Request validation - empty object returns error", () => {
  const result = validateRequest({});
  assertEquals(result.valid, false);
  assertEquals(result.error, "action and data are required");
});

Deno.test("Request validation - valid request has no error", () => {
  const result = validateRequest({ action: "encrypt", data: "test" });
  assertEquals(result.valid, true);
  assertEquals(result.error, undefined);
});
