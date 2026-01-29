/**
 * Validators Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for input validation functions used across Edge Functions.
 * CRITICAL: Invalid input handling can lead to security vulnerabilities.
 * 
 * @module _shared/validators.test
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  isValidUUID,
  isValidEmail,
  isValidCPF,
  isValidPhone,
  isValidString,
  isValidUUIDArray,
  validateCreateOrderInput,
  validateBuyerAuthInput,
  validatePasswordStrength,
} from "./validators.ts";

// ============================================================================
// isValidUUID Tests
// ============================================================================

Deno.test("isValidUUID: should accept valid UUID v4", () => {
  assertEquals(isValidUUID("550e8400-e29b-41d4-a716-446655440000"), true);
});

Deno.test("isValidUUID: should accept valid UUID v1", () => {
  assertEquals(isValidUUID("f47ac10b-58cc-1e77-a8b2-123456789abc"), true);
});

Deno.test("isValidUUID: should accept lowercase UUID", () => {
  assertEquals(isValidUUID("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"), true);
});

Deno.test("isValidUUID: should accept uppercase UUID", () => {
  assertEquals(isValidUUID("A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D"), true);
});

Deno.test("isValidUUID: should reject invalid format", () => {
  assertEquals(isValidUUID("not-a-valid-uuid"), false);
});

Deno.test("isValidUUID: should reject empty string", () => {
  assertEquals(isValidUUID(""), false);
});

Deno.test("isValidUUID: should reject null", () => {
  assertEquals(isValidUUID(null), false);
});

Deno.test("isValidUUID: should reject undefined", () => {
  assertEquals(isValidUUID(undefined), false);
});

Deno.test("isValidUUID: should reject number", () => {
  assertEquals(isValidUUID(12345), false);
});

Deno.test("isValidUUID: should reject UUID without hyphens", () => {
  assertEquals(isValidUUID("550e8400e29b41d4a716446655440000"), false);
});

// ============================================================================
// isValidEmail Tests
// ============================================================================

Deno.test("isValidEmail: should accept valid email", () => {
  assertEquals(isValidEmail("user@example.com"), true);
});

Deno.test("isValidEmail: should accept email with subdomain", () => {
  assertEquals(isValidEmail("user@mail.example.com"), true);
});

Deno.test("isValidEmail: should accept email with plus sign", () => {
  assertEquals(isValidEmail("user+tag@example.com"), true);
});

Deno.test("isValidEmail: should accept email with dots", () => {
  assertEquals(isValidEmail("first.last@example.com"), true);
});

Deno.test("isValidEmail: should accept email with numbers", () => {
  assertEquals(isValidEmail("user123@example.com"), true);
});

Deno.test("isValidEmail: should reject email without @", () => {
  assertEquals(isValidEmail("userexample.com"), false);
});

Deno.test("isValidEmail: should reject email without domain", () => {
  assertEquals(isValidEmail("user@"), false);
});

Deno.test("isValidEmail: should reject email without TLD", () => {
  assertEquals(isValidEmail("user@example"), false);
});

Deno.test("isValidEmail: should reject empty string", () => {
  assertEquals(isValidEmail(""), false);
});

Deno.test("isValidEmail: should reject null", () => {
  assertEquals(isValidEmail(null), false);
});

Deno.test("isValidEmail: should reject very long email (> 255 chars)", () => {
  const longEmail = "a".repeat(250) + "@example.com";
  assertEquals(isValidEmail(longEmail), false);
});

// ============================================================================
// isValidCPF Tests
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

// ============================================================================
// isValidPhone Tests
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

// ============================================================================
// isValidString Tests
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

// ============================================================================
// isValidUUIDArray Tests
// ============================================================================

Deno.test("isValidUUIDArray: should accept array of valid UUIDs", () => {
  const uuids = [
    "550e8400-e29b-41d4-a716-446655440000",
    "f47ac10b-58cc-4e77-a8b2-123456789abc",
  ];
  assertEquals(isValidUUIDArray(uuids), true);
});

Deno.test("isValidUUIDArray: should accept empty array", () => {
  assertEquals(isValidUUIDArray([]), true);
});

Deno.test("isValidUUIDArray: should accept single UUID array", () => {
  assertEquals(isValidUUIDArray(["550e8400-e29b-41d4-a716-446655440000"]), true);
});

Deno.test("isValidUUIDArray: should reject array with invalid UUID", () => {
  const uuids = [
    "550e8400-e29b-41d4-a716-446655440000",
    "not-a-uuid",
  ];
  assertEquals(isValidUUIDArray(uuids), false);
});

Deno.test("isValidUUIDArray: should reject non-array", () => {
  assertEquals(isValidUUIDArray("not-an-array"), false);
});

Deno.test("isValidUUIDArray: should reject null", () => {
  assertEquals(isValidUUIDArray(null), false);
});

// ============================================================================
// validateCreateOrderInput Tests
// ============================================================================

Deno.test("validateCreateOrderInput: should accept valid minimal input", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_name: "João Silva",
    customer_email: "joao@example.com",
    gateway: "mercadopago",
    payment_method: "pix",
  };
  
  const result = validateCreateOrderInput(input);
  
  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(result.data?.product_id, input.product_id);
});

Deno.test("validateCreateOrderInput: should accept full input with optionals", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    offer_id: "550e8400-e29b-41d4-a716-446655440001",
    checkout_id: "550e8400-e29b-41d4-a716-446655440002",
    customer_name: "João Silva",
    customer_email: "joao@example.com",
    customer_phone: "11912345678",
    customer_cpf: "12345678901",
    order_bump_ids: ["550e8400-e29b-41d4-a716-446655440003"],
    gateway: "mercadopago",
    payment_method: "credit_card",
    coupon_id: "550e8400-e29b-41d4-a716-446655440004",
    affiliate_code: "ABC123",
  };
  
  const result = validateCreateOrderInput(input);
  
  assertEquals(result.success, true);
  assertExists(result.data);
});

Deno.test("validateCreateOrderInput: should normalize email to lowercase", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_name: "João Silva",
    customer_email: "JOAO@EXAMPLE.COM",
    gateway: "mercadopago",
    payment_method: "pix",
  };
  
  const result = validateCreateOrderInput(input);
  
  assertEquals(result.success, true);
  assertEquals(result.data?.customer_email, "joao@example.com");
});

Deno.test("validateCreateOrderInput: should trim customer name", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_name: "  João Silva  ",
    customer_email: "joao@example.com",
    gateway: "mercadopago",
    payment_method: "pix",
  };
  
  const result = validateCreateOrderInput(input);
  
  assertEquals(result.success, true);
  assertEquals(result.data?.customer_name, "João Silva");
});

Deno.test("validateCreateOrderInput: should reject invalid product_id", () => {
  const input = {
    product_id: "invalid-uuid",
    customer_name: "João Silva",
    customer_email: "joao@example.com",
    gateway: "mercadopago",
    payment_method: "pix",
  };
  
  const result = validateCreateOrderInput(input);
  
  assertEquals(result.success, false);
  assertEquals(result.errors?.some(e => e.includes("product_id")), true);
});

Deno.test("validateCreateOrderInput: should reject invalid email", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_name: "João Silva",
    customer_email: "invalid-email",
    gateway: "mercadopago",
    payment_method: "pix",
  };
  
  const result = validateCreateOrderInput(input);
  
  assertEquals(result.success, false);
  assertEquals(result.errors?.some(e => e.includes("customer_email")), true);
});

Deno.test("validateCreateOrderInput: should reject short customer name", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_name: "J",
    customer_email: "joao@example.com",
    gateway: "mercadopago",
    payment_method: "pix",
  };
  
  const result = validateCreateOrderInput(input);
  
  assertEquals(result.success, false);
  assertEquals(result.errors?.some(e => e.includes("customer_name")), true);
});

Deno.test("validateCreateOrderInput: should reject null payload", () => {
  const result = validateCreateOrderInput(null);
  
  assertEquals(result.success, false);
  assertEquals(result.errors?.includes("Payload inválido"), true);
});

Deno.test("validateCreateOrderInput: should reject invalid phone format", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_name: "João Silva",
    customer_email: "joao@example.com",
    customer_phone: "123",
    gateway: "mercadopago",
    payment_method: "pix",
  };
  
  const result = validateCreateOrderInput(input);
  
  assertEquals(result.success, false);
  assertEquals(result.errors?.some(e => e.includes("customer_phone")), true);
});

Deno.test("validateCreateOrderInput: should accept empty optional phone", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_name: "João Silva",
    customer_email: "joao@example.com",
    customer_phone: "",
    gateway: "mercadopago",
    payment_method: "pix",
  };
  
  const result = validateCreateOrderInput(input);
  
  assertEquals(result.success, true);
});

// ============================================================================
// validateBuyerAuthInput Tests
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

// ============================================================================
// validatePasswordStrength Tests
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

// ============================================================================
// Edge Cases
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
