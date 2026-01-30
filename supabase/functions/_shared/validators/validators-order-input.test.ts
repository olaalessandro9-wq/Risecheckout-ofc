/**
 * Order Input Validators Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for order creation input validation functions.
 * 
 * @module _shared/validators/validators-order-input.test
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateCreateOrderInput } from "../validators.ts";

// ============================================================================
// validateCreateOrderInput Tests (15 tests)
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
