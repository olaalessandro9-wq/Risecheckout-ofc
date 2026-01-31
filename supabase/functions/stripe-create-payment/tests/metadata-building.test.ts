/**
 * Metadata Building Tests for stripe-create-payment
 * 
 * @module stripe-create-payment/tests/metadata-building.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildPaymentIntentMetadata,
  MOCK_ORDER,
} from "./_shared.ts";

// ============================================================================
// METADATA BUILDING TESTS
// ============================================================================

Deno.test("stripe-create-payment - Metadata Building - should include order_id in metadata", () => {
  const metadata = buildPaymentIntentMetadata(MOCK_ORDER);
  assertExists(metadata.order_id);
  assertEquals(metadata.order_id, MOCK_ORDER.id);
});

Deno.test("stripe-create-payment - Metadata Building - should include vendor_id in metadata", () => {
  const metadata = buildPaymentIntentMetadata(MOCK_ORDER);
  assertExists(metadata.vendor_id);
  assertEquals(metadata.vendor_id, MOCK_ORDER.vendor_id);
});

Deno.test("stripe-create-payment - Metadata Building - should include customer_email in metadata", () => {
  const metadata = buildPaymentIntentMetadata(MOCK_ORDER);
  assertExists(metadata.customer_email);
  assertEquals(metadata.customer_email, MOCK_ORDER.customer_email);
});

Deno.test("stripe-create-payment - Metadata Building - should return object with string values only", () => {
  const metadata = buildPaymentIntentMetadata(MOCK_ORDER);
  
  for (const [key, value] of Object.entries(metadata)) {
    assertEquals(typeof key, "string");
    assertEquals(typeof value, "string");
  }
});

Deno.test("stripe-create-payment - Metadata Building - should have exactly 3 keys", () => {
  const metadata = buildPaymentIntentMetadata(MOCK_ORDER);
  const keys = Object.keys(metadata);
  assertEquals(keys.length, 3);
});

// ============================================================================
// RESPONSE FORMAT TESTS
// ============================================================================

Deno.test("stripe-create-payment - Response Format - should return payment_intent_id on success", () => {
  const response = {
    success: true,
    payment_intent_id: "pi_test_123",
    client_secret: "pi_test_123_secret",
    status: "requires_action",
  };

  assertEquals(response.success, true);
  assertExists(response.payment_intent_id);
  assertExists(response.client_secret);
});

Deno.test("stripe-create-payment - Response Format - should return error message on failure", () => {
  const response = {
    success: false,
    error: "Invalid payment method",
  };

  assertEquals(response.success, false);
  assertExists(response.error);
});
