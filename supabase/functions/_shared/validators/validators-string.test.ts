/**
 * String Validators Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for generic string validation functions.
 * 
 * @module _shared/validators/validators-string.test
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidString } from "../validators.ts";

// ============================================================================
// isValidString Tests (10 tests)
// ============================================================================

Deno.test("isValidString: should accept valid string", () => {
  assertEquals(isValidString("Hello World"), true);
});

Deno.test("isValidString: should accept minimum length", () => {
  assertEquals(isValidString("a", 1, 10), true);
});

Deno.test("isValidString: should accept maximum length", () => {
  assertEquals(isValidString("a".repeat(10), 1, 10), true);
});

Deno.test("isValidString: should reject string below min length", () => {
  assertEquals(isValidString("a", 2, 10), false);
});

Deno.test("isValidString: should reject string above max length", () => {
  assertEquals(isValidString("a".repeat(11), 1, 10), false);
});

Deno.test("isValidString: should trim before checking length", () => {
  assertEquals(isValidString("  a  ", 1, 10), true);
});

Deno.test("isValidString: should reject whitespace-only string", () => {
  assertEquals(isValidString("   ", 1, 10), false);
});

Deno.test("isValidString: should reject empty string by default", () => {
  assertEquals(isValidString(""), false);
});

Deno.test("isValidString: should reject null", () => {
  assertEquals(isValidString(null), false);
});

Deno.test("isValidString: should reject number", () => {
  assertEquals(isValidString(12345), false);
});
