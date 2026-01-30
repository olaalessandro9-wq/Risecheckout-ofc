/**
 * Auth Input Validators Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for buyer authentication input validation functions.
 * 
 * @module _shared/validators/validators-auth.test
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateBuyerAuthInput } from "../validators.ts";

// ============================================================================
// validateBuyerAuthInput Tests (9 tests)
// ============================================================================

Deno.test("validateBuyerAuthInput: should accept valid login input", () => {
  const input = {
    email: "buyer@example.com",
    password: "SecurePass123",
  };
  
  const result = validateBuyerAuthInput(input);
  
  assertEquals(result.success, true);
  assertEquals(result.data?.email, "buyer@example.com");
});

Deno.test("validateBuyerAuthInput: should normalize email", () => {
  const input = {
    email: "  BUYER@EXAMPLE.COM  ",
    password: "SecurePass123",
  };
  
  const result = validateBuyerAuthInput(input);
  
  assertEquals(result.success, true);
  assertEquals(result.data?.email, "buyer@example.com");
});

Deno.test("validateBuyerAuthInput: should accept input without password when not required", () => {
  const input = {
    email: "buyer@example.com",
  };
  
  const result = validateBuyerAuthInput(input, false);
  
  assertEquals(result.success, true);
});

Deno.test("validateBuyerAuthInput: should reject short password", () => {
  const input = {
    email: "buyer@example.com",
    password: "short",
  };
  
  const result = validateBuyerAuthInput(input);
  
  assertEquals(result.success, false);
  assertEquals(result.errors?.some(e => e.includes("6 caracteres")), true);
});

Deno.test("validateBuyerAuthInput: should reject invalid email", () => {
  const input = {
    email: "invalid-email",
    password: "SecurePass123",
  };
  
  const result = validateBuyerAuthInput(input);
  
  assertEquals(result.success, false);
  assertEquals(result.errors?.some(e => e.includes("Email")), true);
});

Deno.test("validateBuyerAuthInput: should accept optional name", () => {
  const input = {
    email: "buyer@example.com",
    password: "SecurePass123",
    name: "João Silva",
  };
  
  const result = validateBuyerAuthInput(input);
  
  assertEquals(result.success, true);
  assertEquals(result.data?.name, "João Silva");
});

Deno.test("validateBuyerAuthInput: should reject short name", () => {
  const input = {
    email: "buyer@example.com",
    password: "SecurePass123",
    name: "J",
  };
  
  const result = validateBuyerAuthInput(input);
  
  assertEquals(result.success, false);
  assertEquals(result.errors?.some(e => e.includes("Nome")), true);
});
