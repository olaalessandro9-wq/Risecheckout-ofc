/**
 * Request Validation Tests for stripe-create-payment
 * 
 * @module stripe-create-payment/tests/request-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validatePaymentRequest,
  MOCK_CARD_REQUEST,
  MOCK_PIX_REQUEST,
  MOCK_ORDER_ID,
} from "./_shared.ts";

// ============================================================================
// REQUEST VALIDATION TESTS
// ============================================================================

Deno.test("stripe-create-payment - Request Validation - should accept valid credit_card request", () => {
  const error = validatePaymentRequest(MOCK_CARD_REQUEST);
  assertEquals(error, null);
});

Deno.test("stripe-create-payment - Request Validation - should accept valid pix request", () => {
  const error = validatePaymentRequest(MOCK_PIX_REQUEST);
  assertEquals(error, null);
});

Deno.test("stripe-create-payment - Request Validation - should reject missing order_id", () => {
  const error = validatePaymentRequest({
    order_id: "",
    payment_method: "pix",
  });
  assertExists(error);
  assertEquals(error, "order_id is required");
});

Deno.test("stripe-create-payment - Request Validation - should reject missing payment_method", () => {
  const error = validatePaymentRequest({
    order_id: MOCK_ORDER_ID,
    payment_method: "" as "pix",
  });
  assertExists(error);
  assertEquals(error, "payment_method is required");
});

Deno.test("stripe-create-payment - Request Validation - should reject invalid payment_method", () => {
  const error = validatePaymentRequest({
    order_id: MOCK_ORDER_ID,
    payment_method: "boleto" as "pix",
  });
  assertExists(error);
  assertEquals(error, "Invalid payment_method");
});

Deno.test("stripe-create-payment - Request Validation - should require payment_method_id for credit_card", () => {
  const error = validatePaymentRequest({
    order_id: MOCK_ORDER_ID,
    payment_method: "credit_card",
    payment_method_id: undefined,
  });
  assertExists(error);
  assertEquals(error, "payment_method_id is required for credit_card");
});

Deno.test("stripe-create-payment - Request Validation - should not require payment_method_id for pix", () => {
  const error = validatePaymentRequest({
    order_id: MOCK_ORDER_ID,
    payment_method: "pix",
  });
  assertEquals(error, null);
});
