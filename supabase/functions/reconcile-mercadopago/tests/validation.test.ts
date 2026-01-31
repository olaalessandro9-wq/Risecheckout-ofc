/**
 * Technical Status & Order Validation Tests for reconcile-mercadopago
 * 
 * @module reconcile-mercadopago/tests/validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mapToTechnicalStatus, validateOrder, mockPendingOrder } from "./_shared.ts";

// ============================================================================
// TECHNICAL STATUS MAPPING TESTS
// ============================================================================

Deno.test("reconcile-mercadopago - Technical Status - should map 'rejected' to 'gateway_error'", () => {
  assertEquals(mapToTechnicalStatus("rejected"), "gateway_error");
});

Deno.test("reconcile-mercadopago - Technical Status - should map 'cancelled' to 'gateway_cancelled'", () => {
  assertEquals(mapToTechnicalStatus("cancelled"), "gateway_cancelled");
});

Deno.test("reconcile-mercadopago - Technical Status - should return same status for others", () => {
  assertEquals(mapToTechnicalStatus("approved"), "approved");
  assertEquals(mapToTechnicalStatus("pending"), "pending");
});

// ============================================================================
// ORDER VALIDATION TESTS
// ============================================================================

Deno.test("reconcile-mercadopago - Order Validation - should accept valid order", () => {
  const result = validateOrder(mockPendingOrder);
  assertEquals(result.valid, true);
});

Deno.test("reconcile-mercadopago - Order Validation - should reject order without ID", () => {
  const invalid = { ...mockPendingOrder, id: "" };
  const result = validateOrder(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Missing order ID");
});

Deno.test("reconcile-mercadopago - Order Validation - should reject order without vendor_id", () => {
  const invalid = { ...mockPendingOrder, vendor_id: "" };
  const result = validateOrder(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Missing vendor ID");
});

Deno.test("reconcile-mercadopago - Order Validation - should reject order without gateway_payment_id", () => {
  const invalid = { ...mockPendingOrder, gateway_payment_id: "" };
  const result = validateOrder(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Missing payment ID");
});
