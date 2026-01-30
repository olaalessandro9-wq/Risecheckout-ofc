/**
 * Sanitizer Module Unit Tests - Order & Auth Inputs
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for complex input sanitization (order and auth).
 * Split from sanitizer.test.ts to respect 300-line limit.
 * 
 * @module _shared/sanitizer-inputs.test
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  sanitizeOrderInput,
  sanitizeAuthInput,
} from "./sanitizer.ts";

// ============================================================================
// sanitizeOrderInput Tests
// ============================================================================

Deno.test("sanitizeOrderInput: should return null for missing required fields", () => {
  assertEquals(sanitizeOrderInput({}), null);
  assertEquals(sanitizeOrderInput({ product_id: "123" }), null);
});

Deno.test("sanitizeOrderInput: should accept valid order input", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_email: "JOHN@EXAMPLE.COM",
    customer_name: "John Doe",
    customer_cpf: "123.456.789-01",
    amount_cents: 5000,
  };
  
  const result = sanitizeOrderInput(input);
  
  assertExists(result);
  assertEquals(result.product_id, "550e8400-e29b-41d4-a716-446655440000");
  assertEquals(result.customer_email, "john@example.com");
  assertEquals(result.customer_name, "John Doe");
  assertEquals(result.customer_cpf, "12345678901");
  assertEquals(result.amount_cents, 5000);
});

Deno.test("sanitizeOrderInput: should handle optional fields", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_email: "john@example.com",
    customer_name: "John Doe",
    customer_cpf: "12345678901",
    amount_cents: 5000,
    offer_id: "550e8400-e29b-41d4-a716-446655440001",
    payment_method: "PIX",
    coupon_code: "save10!@#",
  };
  
  const result = sanitizeOrderInput(input);
  
  assertExists(result);
  assertEquals(result.offer_id, "550e8400-e29b-41d4-a716-446655440001");
  assertEquals(result.payment_method, "pix");
  assertEquals(result.coupon_code, "SAVE10");
});

Deno.test("sanitizeOrderInput: should filter invalid bump_ids", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_email: "john@example.com",
    customer_name: "John Doe",
    customer_cpf: "12345678901",
    amount_cents: 5000,
    bump_ids: [
      "550e8400-e29b-41d4-a716-446655440001",
      "invalid-uuid",
      "550e8400-e29b-41d4-a716-446655440002",
    ],
  };
  
  const result = sanitizeOrderInput(input);
  
  assertExists(result);
  assertEquals(result.bump_ids?.length, 2);
});

Deno.test("sanitizeOrderInput: should handle null bump_ids", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_email: "john@example.com",
    customer_name: "John Doe",
    customer_cpf: "12345678901",
    amount_cents: 5000,
    bump_ids: null,
  };
  
  const result = sanitizeOrderInput(input);
  
  assertExists(result);
  assertEquals(result.bump_ids, undefined);
});

Deno.test("sanitizeOrderInput: should handle XSS in customer name", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_email: "john@example.com",
    customer_name: "<script>alert('xss')</script>John",
    customer_cpf: "12345678901",
    amount_cents: 5000,
  };
  
  const result = sanitizeOrderInput(input);
  
  assertExists(result);
  assertEquals(result.customer_name.includes("<script>"), false);
  assertEquals(result.customer_name.includes("John"), true);
});

Deno.test("sanitizeOrderInput: should sanitize SQL injection in email", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_email: "user'--@example.com",
    customer_name: "John Doe",
    customer_cpf: "12345678901",
    amount_cents: 5000,
  };
  
  const result = sanitizeOrderInput(input);
  
  assertExists(result);
  assertEquals(result.customer_email.includes("'"), false);
});

// ============================================================================
// sanitizeAuthInput Tests
// ============================================================================

Deno.test("sanitizeAuthInput: should return null for missing required fields", () => {
  assertEquals(sanitizeAuthInput({}), null);
  assertEquals(sanitizeAuthInput({ email: "test@example.com" }), null);
});

Deno.test("sanitizeAuthInput: should accept valid auth input", () => {
  const input = {
    email: "USER@EXAMPLE.COM",
    password: "SecurePass123!",
  };
  
  const result = sanitizeAuthInput(input);
  
  assertExists(result);
  assertEquals(result.email, "user@example.com");
  assertEquals(result.password, "SecurePass123!");
});

Deno.test("sanitizeAuthInput: should handle optional fields", () => {
  const input = {
    email: "user@example.com",
    password: "SecurePass123!",
    name: "John <b>Doe</b>",
    phone: "(11) 91234-5678",
  };
  
  const result = sanitizeAuthInput(input);
  
  assertExists(result);
  assertEquals(result.name, "John Doe");
  assertEquals(result.phone, "11912345678");
});

Deno.test("sanitizeAuthInput: should not sanitize password special chars", () => {
  const input = {
    email: "user@example.com",
    password: "P@$$w0rd!<script>",
  };
  
  const result = sanitizeAuthInput(input);
  
  assertExists(result);
  assertEquals(result.password, "P@$$w0rd!<script>");
});

Deno.test("sanitizeAuthInput: should handle empty name", () => {
  const input = {
    email: "user@example.com",
    password: "SecurePass123!",
    name: "",
  };
  
  const result = sanitizeAuthInput(input);
  
  assertExists(result);
  // Empty name becomes undefined (optional field)
  assertEquals(result.name === "" || result.name === undefined, true);
});

Deno.test("sanitizeAuthInput: should handle missing optional phone", () => {
  const input = {
    email: "user@example.com",
    password: "SecurePass123!",
  };
  
  const result = sanitizeAuthInput(input);
  
  assertExists(result);
  assertEquals(result.phone, undefined);
});

// ============================================================================
// Combined Security Tests
// ============================================================================

Deno.test("Security: Order input with all attack vectors", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_email: "user<script>@example.com",
    customer_name: "<script>alert(1)</script>John' OR '1'='1",
    customer_cpf: "123.456.789-01'; DROP TABLE users;--",
    amount_cents: 5000,
    coupon_code: "SAVE<script>10",
  };
  
  const result = sanitizeOrderInput(input);
  
  assertExists(result);
  assertEquals(result.customer_email.includes("<script>"), false);
  assertEquals(result.customer_name.includes("<script>"), false);
  assertEquals(result.customer_name.includes("OR"), false);
  assertEquals(result.customer_cpf, "12345678901");
  assertEquals(result.coupon_code?.includes("<script>"), false);
});

Deno.test("Security: Auth input with attack vectors", () => {
  const input = {
    email: "admin'--@example.com",
    password: "password",
    name: "<script>alert(document.cookie)</script>Hacker",
  };
  
  const result = sanitizeAuthInput(input);
  
  assertExists(result);
  assertEquals(result.email.includes("'"), false);
  assertEquals(result.name?.includes("<script>") ?? true, false);
  assertEquals(result.name?.includes("Hacker") ?? false, true);
});
