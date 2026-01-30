/**
 * Edge Cases Validators Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for edge case scenarios in validation functions.
 * 
 * @module _shared/validators/validators-edge-cases.test
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateCreateOrderInput, isValidEmail } from "../validators.ts";

// ============================================================================
// Edge Cases Tests (5 tests)
// ============================================================================

Deno.test("Edge Case: validateCreateOrderInput with undefined payload", () => {
  const result = validateCreateOrderInput(undefined);
  
  assertEquals(result.success, false);
});

Deno.test("Edge Case: validateCreateOrderInput with string payload", () => {
  const result = validateCreateOrderInput("not an object");
  
  assertEquals(result.success, false);
});

Deno.test("Edge Case: validateCreateOrderInput with array payload", () => {
  const result = validateCreateOrderInput([1, 2, 3]);
  
  assertEquals(result.success, false);
});

Deno.test("Edge Case: isValidEmail with international domain", () => {
  assertEquals(isValidEmail("user@exemplo.com.br"), true);
});

Deno.test("Edge Case: isValidEmail with new TLDs", () => {
  assertEquals(isValidEmail("user@example.tech"), true);
});
