/**
 * CPF Validators Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for CPF (Brazilian ID) validation functions.
 * 
 * @module _shared/validators/validators-cpf.test
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidCPF } from "../validators.ts";

// ============================================================================
// isValidCPF Tests (8 tests)
// ============================================================================

Deno.test("isValidCPF: should accept 11 digits", () => {
  assertEquals(isValidCPF("12345678901"), true);
});

Deno.test("isValidCPF: should accept formatted CPF", () => {
  assertEquals(isValidCPF("123.456.789-01"), true);
});

Deno.test("isValidCPF: should accept CPF with spaces", () => {
  assertEquals(isValidCPF("123 456 789 01"), true);
});

Deno.test("isValidCPF: should reject 10 digits", () => {
  assertEquals(isValidCPF("1234567890"), false);
});

Deno.test("isValidCPF: should reject 12 digits", () => {
  assertEquals(isValidCPF("123456789012"), false);
});

Deno.test("isValidCPF: should reject empty string", () => {
  assertEquals(isValidCPF(""), false);
});

Deno.test("isValidCPF: should reject null", () => {
  assertEquals(isValidCPF(null), false);
});

Deno.test("isValidCPF: should reject letters", () => {
  assertEquals(isValidCPF("1234567890a"), false);
});
