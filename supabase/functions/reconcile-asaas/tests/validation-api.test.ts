/**
 * Validation & API Tests for reconcile-asaas
 * 
 * @module reconcile-asaas/tests/validation-api.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getAsaasBaseUrl,
  validateOrderForReconciliation,
  mockPendingOrder,
  MOCK_PAYMENT_ID,
} from "./_shared.ts";

// ============================================================================
// API URL TESTS
// ============================================================================

Deno.test("reconcile-asaas - API URL Building - should return production URL for non-sandbox", () => {
  const url = getAsaasBaseUrl(false);
  assertEquals(url, "https://api.asaas.com/v3");
});

Deno.test("reconcile-asaas - API URL Building - should return sandbox URL for sandbox mode", () => {
  const url = getAsaasBaseUrl(true);
  assertEquals(url, "https://sandbox.asaas.com/api/v3");
});

Deno.test("reconcile-asaas - API URL Building - should build correct payment status URL", () => {
  const baseUrl = getAsaasBaseUrl(false);
  const paymentUrl = `${baseUrl}/payments/${MOCK_PAYMENT_ID}`;
  assertEquals(paymentUrl, `https://api.asaas.com/v3/payments/${MOCK_PAYMENT_ID}`);
});

// ============================================================================
// ORDER VALIDATION TESTS
// ============================================================================

Deno.test("reconcile-asaas - Order Validation - should accept valid order", () => {
  const result = validateOrderForReconciliation(mockPendingOrder);
  assertEquals(result.valid, true);
});

Deno.test("reconcile-asaas - Order Validation - should reject order without ID", () => {
  const invalid = { ...mockPendingOrder, id: "" };
  const result = validateOrderForReconciliation(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Missing order ID");
});

Deno.test("reconcile-asaas - Order Validation - should reject order without vendor_id", () => {
  const invalid = { ...mockPendingOrder, vendor_id: "" };
  const result = validateOrderForReconciliation(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Missing vendor ID");
});

Deno.test("reconcile-asaas - Order Validation - should reject order without gateway_payment_id", () => {
  const invalid = { ...mockPendingOrder, gateway_payment_id: "" };
  const result = validateOrderForReconciliation(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Missing gateway payment ID");
});
