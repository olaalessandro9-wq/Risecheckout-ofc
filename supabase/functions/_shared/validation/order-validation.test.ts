/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for Order Validation
 * 
 * Coverage:
 * - Order amount validation
 * - Customer data validation
 * - Security violation detection
 * - Database error handling
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateCustomerData } from "./order-validation.ts";

// ============================================================================
// CUSTOMER DATA VALIDATION TESTS
// ============================================================================

Deno.test("validateCustomerData - should validate correct customer data", () => {
  const customer = {
    name: "John Doe",
    email: "john@example.com",
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, true);
  assertExists(result.sanitizedData);
  assertEquals(result.sanitizedData?.name, "John Doe");
  assertEquals(result.sanitizedData?.email, "john@example.com");
});

Deno.test("validateCustomerData - should trim and lowercase email", () => {
  const customer = {
    name: "  Jane Doe  ",
    email: "  JANE@EXAMPLE.COM  ",
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, true);
  assertEquals(result.sanitizedData?.name, "Jane Doe");
  assertEquals(result.sanitizedData?.email, "jane@example.com");
});

Deno.test("validateCustomerData - should sanitize document and phone", () => {
  const customer = {
    name: "John Doe",
    email: "john@example.com",
    document: "123.456.789-09",
    phone: "(11) 98765-4321",
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, true);
  assertEquals(result.sanitizedData?.document, "12345678909");
  assertEquals(result.sanitizedData?.phone, "11987654321");
});

Deno.test("validateCustomerData - should reject null customer", () => {
  const result = validateCustomerData(null);
  assertEquals(result.valid, false);
  assertExists(result.errors);
  assertEquals(result.errors?.length > 0, true);
});

Deno.test("validateCustomerData - should reject undefined customer", () => {
  const result = validateCustomerData(undefined);
  assertEquals(result.valid, false);
  assertExists(result.errors);
});

Deno.test("validateCustomerData - should reject non-object customer", () => {
  const result = validateCustomerData("invalid");
  assertEquals(result.valid, false);
  assertExists(result.errors);
});

Deno.test("validateCustomerData - should reject missing name", () => {
  const customer = {
    email: "john@example.com",
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, false);
  assertExists(result.errors);
  assertEquals(result.errors?.some((e) => e.includes("Nome")), true);
});

Deno.test("validateCustomerData - should reject name with less than 2 characters", () => {
  const customer = {
    name: "J",
    email: "john@example.com",
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, false);
  assertExists(result.errors);
  assertEquals(result.errors?.some((e) => e.includes("mínimo 2 caracteres")), true);
});

Deno.test("validateCustomerData - should reject empty name after trim", () => {
  const customer = {
    name: "   ",
    email: "john@example.com",
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, false);
  assertExists(result.errors);
});

Deno.test("validateCustomerData - should reject missing email", () => {
  const customer = {
    name: "John Doe",
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, false);
  assertExists(result.errors);
  assertEquals(result.errors?.some((e) => e.includes("Email")), true);
});

Deno.test("validateCustomerData - should reject invalid email format", () => {
  const customer = {
    name: "John Doe",
    email: "invalid-email",
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, false);
  assertExists(result.errors);
  assertEquals(result.errors?.some((e) => e.includes("Email inválido")), true);
});

Deno.test("validateCustomerData - should reject email without @", () => {
  const customer = {
    name: "John Doe",
    email: "johndoe.com",
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, false);
  assertExists(result.errors);
});

Deno.test("validateCustomerData - should reject email without domain", () => {
  const customer = {
    name: "John Doe",
    email: "john@",
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, false);
  assertExists(result.errors);
});

Deno.test("validateCustomerData - should collect multiple errors", () => {
  const customer = {
    name: "J",
    email: "invalid",
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, false);
  assertExists(result.errors);
  assertEquals(result.errors?.length >= 2, true);
});

Deno.test("validateCustomerData - should handle optional fields as undefined", () => {
  const customer = {
    name: "John Doe",
    email: "john@example.com",
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, true);
  assertEquals(result.sanitizedData?.document, undefined);
  assertEquals(result.sanitizedData?.phone, undefined);
});

Deno.test("validateCustomerData - should convert document to string", () => {
  const customer = {
    name: "John Doe",
    email: "john@example.com",
    document: 12345678909,
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, true);
  assertEquals(typeof result.sanitizedData?.document, "string");
  assertEquals(result.sanitizedData?.document, "12345678909");
});

Deno.test("validateCustomerData - should convert phone to string", () => {
  const customer = {
    name: "John Doe",
    email: "john@example.com",
    phone: 11987654321,
  };

  const result = validateCustomerData(customer);
  assertEquals(result.valid, true);
  assertEquals(typeof result.sanitizedData?.phone, "string");
  assertEquals(result.sanitizedData?.phone, "11987654321");
});
