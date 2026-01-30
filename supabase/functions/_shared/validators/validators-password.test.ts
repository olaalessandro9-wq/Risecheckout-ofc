/**
 * Password Strength Validators Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for password strength validation functions.
 * 
 * @module _shared/validators/validators-password.test
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validatePasswordStrength } from "../validators.ts";

// ============================================================================
// validatePasswordStrength Tests (5 tests)
// ============================================================================

Deno.test("validatePasswordStrength: should accept strong password", () => {
  const result = validatePasswordStrength("SecurePass123");
  
  assertEquals(result.valid, true);
  assertEquals(result.message, undefined);
});

Deno.test("validatePasswordStrength: should reject password too short", () => {
  const result = validatePasswordStrength("Short1");
  
  assertEquals(result.valid, false);
  assertEquals(result.message?.includes("8 caracteres"), true);
});

Deno.test("validatePasswordStrength: should reject password without uppercase", () => {
  const result = validatePasswordStrength("lowercase123");
  
  assertEquals(result.valid, false);
  assertEquals(result.message?.includes("maiúscula"), true);
});

Deno.test("validatePasswordStrength: should reject password without lowercase", () => {
  const result = validatePasswordStrength("UPPERCASE123");
  
  assertEquals(result.valid, false);
  assertEquals(result.message?.includes("minúscula"), true);
});

Deno.test("validatePasswordStrength: should reject password without number", () => {
  const result = validatePasswordStrength("NoNumbersHere");
  
  assertEquals(result.valid, false);
  assertEquals(result.message?.includes("número"), true);
});
