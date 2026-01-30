/**
 * Phone Validators Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for Brazilian phone number validation functions.
 * 
 * @module _shared/validators/validators-phone.test
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidPhone } from "../validators.ts";

// ============================================================================
// isValidPhone Tests (8 tests)
// ============================================================================

Deno.test("isValidPhone: should accept 10 digits (landline)", () => {
  assertEquals(isValidPhone("1134567890"), true);
});

Deno.test("isValidPhone: should accept 11 digits (mobile)", () => {
  assertEquals(isValidPhone("11912345678"), true);
});

Deno.test("isValidPhone: should accept formatted phone", () => {
  assertEquals(isValidPhone("(11) 91234-5678"), true);
});

Deno.test("isValidPhone: should accept phone with spaces", () => {
  assertEquals(isValidPhone("11 91234 5678"), true);
});

Deno.test("isValidPhone: should reject 9 digits", () => {
  assertEquals(isValidPhone("123456789"), false);
});

Deno.test("isValidPhone: should reject 12 digits", () => {
  assertEquals(isValidPhone("123456789012"), false);
});

Deno.test("isValidPhone: should reject empty string", () => {
  assertEquals(isValidPhone(""), false);
});

Deno.test("isValidPhone: should reject null", () => {
  assertEquals(isValidPhone(null), false);
});
