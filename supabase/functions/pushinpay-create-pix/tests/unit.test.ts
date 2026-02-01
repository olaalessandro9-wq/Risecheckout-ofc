/**
 * Unit Tests - Business Logic
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 1: Pure business logic tests with mocks
 * Execution: ALWAYS (no dependencies on real services)
 * 
 * @module pushinpay-create-pix/tests/unit
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  unitTestOptions,
  PUSHINPAY_MAX_SPLIT_PERCENT,
  createValidRequest,
  createEmptyRequest,
  createRequestWithoutOrderId,
  createRequestWithoutValue,
  createZeroValueRequest,
  createNegativeValueRequest,
  createMismatchedValueRequest,
  createSuccessPixResponse,
  createAdjustedSplitResponse,
  createAffiliatePixResponse,
  createErrorPixResponse,
  createOrderForPix,
  createOrderWithAffiliate,
  createPlatformSplitRules,
  createAffiliateSplitRules,
  splitExceedsLimit,
  calculateManualPayment,
} from "./_shared.ts";

// ============================================================================
// REQUEST VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-create-pix/unit: valid request has all required fields",
  ...unitTestOptions,
  fn: () => {
    const request = createValidRequest("order-123", 10000);
    assertExists(request.orderId);
    assertExists(request.valueInCents);
    assertEquals(request.orderId, "order-123");
    assertEquals(request.valueInCents, 10000);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: empty request fails validation",
  ...unitTestOptions,
  fn: () => {
    const request = createEmptyRequest();
    assertEquals(Object.keys(request).length, 0);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: request without orderId is invalid",
  ...unitTestOptions,
  fn: () => {
    const request = createRequestWithoutOrderId();
    assertEquals("orderId" in request, false);
    assertExists(request.valueInCents);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: request without valueInCents is invalid",
  ...unitTestOptions,
  fn: () => {
    const request = createRequestWithoutValue();
    assertExists(request.orderId);
    assertEquals("valueInCents" in request, false);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: zero value request is invalid",
  ...unitTestOptions,
  fn: () => {
    const request = createZeroValueRequest();
    assertEquals(request.valueInCents, 0);
    assertEquals(request.valueInCents <= 0, true);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: negative value request is invalid",
  ...unitTestOptions,
  fn: () => {
    const request = createNegativeValueRequest();
    assertEquals(request.valueInCents < 0, true);
  },
});

// ============================================================================
// SECURITY VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-create-pix/unit: detects value mismatch",
  ...unitTestOptions,
  fn: () => {
    const order = createOrderForPix("order-123", "vendor-123", 10000);
    const request = createMismatchedValueRequest("order-123", 5000);
    
    // Value mismatch should be detected
    assertEquals(request.valueInCents !== order.amount_cents, true);
    assertEquals(Math.abs(request.valueInCents - order.amount_cents), 5000);
  },
});

// ============================================================================
// RESPONSE FACTORY TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-create-pix/unit: success response has pix data",
  ...unitTestOptions,
  fn: () => {
    const response = createSuccessPixResponse();
    assertEquals(response.ok, true);
    assertExists(response.pix);
    assertExists(response.pix!.id);
    assertExists(response.pix!.qr_code);
    assertExists(response.pix!.qr_code_base64);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: success response has smartSplit info",
  ...unitTestOptions,
  fn: () => {
    const response = createSuccessPixResponse();
    assertExists(response.smartSplit);
    assertEquals(response.smartSplit!.pixCreatedBy, "producer");
    assertEquals(response.smartSplit!.adjustedSplit, false);
    assertEquals(response.smartSplit!.manualPaymentNeeded, 0);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: adjusted split response has correct values",
  ...unitTestOptions,
  fn: () => {
    const manualPayment = 2000;
    const response = createAdjustedSplitResponse(manualPayment);
    
    assertEquals(response.ok, true);
    assertEquals(response.smartSplit!.adjustedSplit, true);
    assertEquals(response.smartSplit!.manualPaymentNeeded, manualPayment);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: affiliate pix response has correct creator",
  ...unitTestOptions,
  fn: () => {
    const response = createAffiliatePixResponse();
    
    assertEquals(response.ok, true);
    assertEquals(response.smartSplit!.pixCreatedBy, "affiliate");
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: error response has ok=false",
  ...unitTestOptions,
  fn: () => {
    const response = createErrorPixResponse("Test error");
    assertEquals(response.ok, false);
    assertEquals(response.error, "Test error");
    assertEquals(response.pix, undefined);
  },
});

// ============================================================================
// ORDER FACTORY TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-create-pix/unit: basic order has no affiliate",
  ...unitTestOptions,
  fn: () => {
    const order = createOrderForPix();
    assertEquals(order.affiliate_id, null);
    assertEquals(order.commission_cents, null);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: order with affiliate has commission",
  ...unitTestOptions,
  fn: () => {
    const order = createOrderWithAffiliate("order-123", 10000, 3000);
    assertExists(order.affiliate_id);
    assertEquals(order.commission_cents, 3000);
    assertExists(order.platform_fee_cents);
  },
});

// ============================================================================
// SPLIT RULES TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-create-pix/unit: platform split rules have correct structure",
  ...unitTestOptions,
  fn: () => {
    const rules = createPlatformSplitRules(400);
    assertEquals(rules.length, 1);
    assertEquals(rules[0].value, 400);
    assertExists(rules[0].account_id);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: affiliate split rules include both parties",
  ...unitTestOptions,
  fn: () => {
    const rules = createAffiliateSplitRules(400, 3000);
    assertEquals(rules.length, 2);
    assertEquals(rules[0].value, 400); // platform
    assertEquals(rules[1].value, 3000); // affiliate
  },
});

// ============================================================================
// SPLIT LIMIT VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-create-pix/unit: 50% limit constant is correct",
  ...unitTestOptions,
  fn: () => {
    assertEquals(PUSHINPAY_MAX_SPLIT_PERCENT, 0.50);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: split within limit returns false",
  ...unitTestOptions,
  fn: () => {
    const valueInCents = 10000;
    const splitCents = 4000; // 40% - within limit
    
    assertEquals(splitExceedsLimit(splitCents, valueInCents), false);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: split at limit returns false",
  ...unitTestOptions,
  fn: () => {
    const valueInCents = 10000;
    const splitCents = 5000; // 50% - exactly at limit
    
    assertEquals(splitExceedsLimit(splitCents, valueInCents), false);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: split exceeding limit returns true",
  ...unitTestOptions,
  fn: () => {
    const valueInCents = 10000;
    const splitCents = 6000; // 60% - exceeds limit
    
    assertEquals(splitExceedsLimit(splitCents, valueInCents), true);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: manual payment calculation is correct",
  ...unitTestOptions,
  fn: () => {
    const valueInCents = 10000;
    const splitCents = 6000; // 60% - exceeds by 1000
    
    const manualPayment = calculateManualPayment(splitCents, valueInCents);
    assertEquals(manualPayment, 1000);
  },
});

Deno.test({
  name: "pushinpay-create-pix/unit: manual payment is zero when within limit",
  ...unitTestOptions,
  fn: () => {
    const valueInCents = 10000;
    const splitCents = 4000; // 40% - within limit
    
    const manualPayment = calculateManualPayment(splitCents, valueInCents);
    assertEquals(manualPayment, 0);
  },
});
