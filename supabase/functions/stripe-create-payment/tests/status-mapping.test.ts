/**
 * Status Mapping Tests for stripe-create-payment
 * 
 * @module stripe-create-payment/tests/status-mapping.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mapPaymentStatus } from "./_shared.ts";

// ============================================================================
// STATUS MAPPING TESTS
// ============================================================================

Deno.test("stripe-create-payment - Status Mapping - should map 'succeeded' to 'paid'", () => {
  const result = mapPaymentStatus("succeeded");
  assertEquals(result, "paid");
});

Deno.test("stripe-create-payment - Status Mapping - should map 'requires_payment_method' to 'pending'", () => {
  const result = mapPaymentStatus("requires_payment_method");
  assertEquals(result, "pending");
});

Deno.test("stripe-create-payment - Status Mapping - should map 'requires_confirmation' to 'pending'", () => {
  const result = mapPaymentStatus("requires_confirmation");
  assertEquals(result, "pending");
});

Deno.test("stripe-create-payment - Status Mapping - should map 'requires_action' to 'pending'", () => {
  const result = mapPaymentStatus("requires_action");
  assertEquals(result, "pending");
});

Deno.test("stripe-create-payment - Status Mapping - should map 'canceled' to 'cancelled'", () => {
  const result = mapPaymentStatus("canceled");
  assertEquals(result, "cancelled");
});

Deno.test("stripe-create-payment - Status Mapping - should map 'requires_capture' to 'authorized'", () => {
  const result = mapPaymentStatus("requires_capture");
  assertEquals(result, "authorized");
});

Deno.test("stripe-create-payment - Status Mapping - should map unknown status to 'pending'", () => {
  const result = mapPaymentStatus("unknown_status");
  assertEquals(result, "pending");
});

Deno.test("stripe-create-payment - Status Mapping - should handle empty string as 'pending'", () => {
  const result = mapPaymentStatus("");
  assertEquals(result, "pending");
});
