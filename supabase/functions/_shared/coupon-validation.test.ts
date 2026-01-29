/**
 * Coupon Validation Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for coupon payload validation and business rules.
 * CRITICAL: Discount calculations directly affect revenue.
 * 
 * @module _shared/coupon-validation.test
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validateCouponPayload,
  type CouponPayload,
} from "./coupon-validation.ts";

// ============================================================================
// validateCouponPayload Tests - Valid Inputs
// ============================================================================

Deno.test("validateCouponPayload: should accept valid minimal payload", () => {
  const payload = {
    code: "DESCONTO10",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertExists(result.sanitized);
  assertEquals(result.sanitized?.code, "DESCONTO10");
  assertEquals(result.sanitized?.discount_value, 10);
});

Deno.test("validateCouponPayload: should accept full payload", () => {
  const payload = {
    code: "PROMO2024",
    name: "Promoção de Verão",
    description: "Desconto especial",
    discount_type: "percentage",
    discount_value: 25,
    max_uses: 100,
    max_uses_per_customer: 1,
    expires_at: "2024-12-31T23:59:59Z",
    start_date: "2024-01-01T00:00:00Z",
    active: true,
    apply_to_order_bumps: true,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertExists(result.sanitized);
  assertEquals(result.sanitized?.code, "PROMO2024");
  assertEquals(result.sanitized?.name, "Promoção de Verão");
  assertEquals(result.sanitized?.max_uses, 100);
  assertEquals(result.sanitized?.apply_to_order_bumps, true);
});

Deno.test("validateCouponPayload: should uppercase code", () => {
  const payload = {
    code: "desconto",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.code, "DESCONTO");
});

Deno.test("validateCouponPayload: should trim code", () => {
  const payload = {
    code: "  PROMO  ",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.code, "PROMO");
});

Deno.test("validateCouponPayload: should accept minimum valid discount (1%)", () => {
  const payload = {
    code: "MINIMAL",
    discount_type: "percentage",
    discount_value: 1,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.discount_value, 1);
});

Deno.test("validateCouponPayload: should accept maximum valid discount (99%)", () => {
  const payload = {
    code: "MAXIMAL",
    discount_type: "percentage",
    discount_value: 99,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.discount_value, 99);
});

Deno.test("validateCouponPayload: should accept decimal discount values", () => {
  const payload = {
    code: "DECIMAL",
    discount_type: "percentage",
    discount_value: 15.5,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.discount_value, 15.5);
});

Deno.test("validateCouponPayload: should accept minimum code length (3)", () => {
  const payload = {
    code: "ABC",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.code, "ABC");
});

Deno.test("validateCouponPayload: should accept maximum code length (50)", () => {
  const payload = {
    code: "A".repeat(50),
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.code.length, 50);
});

// ============================================================================
// validateCouponPayload Tests - Invalid Inputs
// ============================================================================

Deno.test("validateCouponPayload: should reject missing code", () => {
  const payload = {
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Código do cupom é obrigatório");
});

Deno.test("validateCouponPayload: should reject empty code", () => {
  const payload = {
    code: "",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Código do cupom é obrigatório");
});

Deno.test("validateCouponPayload: should reject non-string code", () => {
  const payload = {
    code: 12345,
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Código do cupom é obrigatório");
});

Deno.test("validateCouponPayload: should reject code too short (< 3 chars)", () => {
  const payload = {
    code: "AB",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Código deve ter entre 3 e 50 caracteres");
});

Deno.test("validateCouponPayload: should reject code too long (> 50 chars)", () => {
  const payload = {
    code: "A".repeat(51),
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Código deve ter entre 3 e 50 caracteres");
});

Deno.test("validateCouponPayload: should reject non-percentage discount type", () => {
  const payload = {
    code: "FIXED10",
    discount_type: "fixed",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Apenas desconto por porcentagem é suportado");
});

Deno.test("validateCouponPayload: should reject 'absolute' discount type", () => {
  const payload = {
    code: "ABSOLUTE",
    discount_type: "absolute",
    discount_value: 100,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Apenas desconto por porcentagem é suportado");
});

Deno.test("validateCouponPayload: should reject zero discount", () => {
  const payload = {
    code: "ZERO",
    discount_type: "percentage",
    discount_value: 0,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Valor do desconto deve ser positivo");
});

Deno.test("validateCouponPayload: should reject negative discount", () => {
  const payload = {
    code: "NEGATIVE",
    discount_type: "percentage",
    discount_value: -10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Valor do desconto deve ser positivo");
});

Deno.test("validateCouponPayload: should reject discount > 99%", () => {
  const payload = {
    code: "TOOMUCH",
    discount_type: "percentage",
    discount_value: 100,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Percentual de desconto não pode exceder 99%");
});

Deno.test("validateCouponPayload: should reject discount > 100%", () => {
  const payload = {
    code: "INVALID",
    discount_type: "percentage",
    discount_value: 150,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Percentual de desconto não pode exceder 99%");
});

Deno.test("validateCouponPayload: should reject non-number discount", () => {
  const payload = {
    code: "NOTNUM",
    discount_type: "percentage",
    discount_value: "ten",
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Valor do desconto deve ser positivo");
});

// ============================================================================
// validateCouponPayload Tests - Default Values
// ============================================================================

Deno.test("validateCouponPayload: should set active=true by default", () => {
  const payload = {
    code: "ACTIVE",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.active, true);
});

Deno.test("validateCouponPayload: should respect active=false", () => {
  const payload = {
    code: "INACTIVE",
    discount_type: "percentage",
    discount_value: 10,
    active: false,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.active, false);
});

Deno.test("validateCouponPayload: should set apply_to_order_bumps=false by default", () => {
  const payload = {
    code: "NOBUMPS",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.apply_to_order_bumps, false);
});

Deno.test("validateCouponPayload: should convert truthy apply_to_order_bumps", () => {
  const payload = {
    code: "BUMPS",
    discount_type: "percentage",
    discount_value: 10,
    apply_to_order_bumps: true,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.apply_to_order_bumps, true);
});

Deno.test("validateCouponPayload: should set null for optional missing fields", () => {
  const payload = {
    code: "MINIMAL",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.max_uses, null);
  assertEquals(result.sanitized?.max_uses_per_customer, null);
  assertEquals(result.sanitized?.expires_at, null);
  assertEquals(result.sanitized?.start_date, null);
});

// ============================================================================
// validateCouponPayload Tests - Edge Cases
// ============================================================================

Deno.test("Edge Case: whitespace-only code should fail", () => {
  const payload = {
    code: "   ",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, false);
});

Deno.test("Edge Case: code with trailing whitespace should be trimmed", () => {
  const payload = {
    code: "  PROMO  ",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.code, "PROMO");
});

Deno.test("Edge Case: discount of 0.1% should work", () => {
  const payload = {
    code: "TINY",
    discount_type: "percentage",
    discount_value: 0.1,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.discount_value, 0.1);
});

Deno.test("Edge Case: discount of 98.99% should work", () => {
  const payload = {
    code: "ALMOSTMAX",
    discount_type: "percentage",
    discount_value: 98.99,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.discount_value, 98.99);
});

Deno.test("Edge Case: empty object should fail", () => {
  const result = validateCouponPayload({});
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Código do cupom é obrigatório");
});

// RISE V3: Testes validam comportamento CORRETO (não bugs)
Deno.test("Edge Case: null payload should return valid: false", () => {
  const result = validateCouponPayload(null);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Payload inválido");
});

Deno.test("Edge Case: undefined payload should return valid: false", () => {
  const result = validateCouponPayload(undefined);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Payload inválido");
});

Deno.test("Edge Case: non-object payload (string) should return valid: false", () => {
  const result = validateCouponPayload("not an object");
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Payload deve ser um objeto");
});

Deno.test("Edge Case: non-object payload (number) should return valid: false", () => {
  const result = validateCouponPayload(12345);
  
  assertEquals(result.valid, false);
  assertEquals(result.error, "Payload deve ser um objeto");
});

Deno.test("Edge Case: non-object payload (array) should return valid: false", () => {
  const result = validateCouponPayload([1, 2, 3]);
  
  assertEquals(result.valid, false);
  // Arrays are typeof "object", so they pass the object check but fail on code
  assertEquals(result.valid, false);
});

// ============================================================================
// validateCouponPayload Tests - Name and Description Sanitization
// ============================================================================

Deno.test("validateCouponPayload: should trim name", () => {
  const payload = {
    code: "NAMED",
    name: "  Promo Name  ",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.name, "Promo Name");
});

Deno.test("validateCouponPayload: should trim description", () => {
  const payload = {
    code: "DESC",
    description: "  Descrição do cupom  ",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.description, "Descrição do cupom");
});

Deno.test("validateCouponPayload: should set undefined for missing name", () => {
  const payload = {
    code: "NONAME",
    discount_type: "percentage",
    discount_value: 10,
  };
  
  const result = validateCouponPayload(payload);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized?.name, undefined);
});

// ============================================================================
// Type Validation Tests
// ============================================================================

Deno.test("Type: CouponPayload structure should be correct", () => {
  const validPayload: CouponPayload = {
    code: "TEST",
    discount_type: "percentage",
    discount_value: 10,
    name: "Test",
    description: "Test desc",
    max_uses: 100,
    max_uses_per_customer: 1,
    expires_at: "2024-12-31",
    start_date: "2024-01-01",
    active: true,
    apply_to_order_bumps: false,
  };
  
  // Type check - if this compiles, types are correct
  assertEquals(typeof validPayload.code, "string");
  assertEquals(validPayload.discount_type, "percentage");
});
