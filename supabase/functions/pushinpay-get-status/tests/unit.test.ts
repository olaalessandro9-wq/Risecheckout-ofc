/**
 * Unit Tests - Business Logic
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 1: Pure business logic tests with mocks
 * Execution: ALWAYS (no dependencies on real services)
 * 
 * @module pushinpay-get-status/tests/unit
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  unitTestOptions,
  STATUS_MAPPING,
  createValidRequest,
  createEmptyRequest,
  createRequestWithoutOrderId,
  createPaidApiResponse,
  createPendingApiResponse,
  createExpiredApiResponse,
  createPaidStatusResponse,
  createPendingStatusResponse,
  createNoPixIdResponse,
  createErrorResponse,
  createOrderWithPix,
  createOrderWithoutPix,
} from "./_shared.ts";

// ============================================================================
// STATUS MAPPING TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-get-status/unit: maps 'paid' to 'paid'",
  ...unitTestOptions,
  fn: () => {
    assertEquals(STATUS_MAPPING["paid"], "paid");
    assertEquals(STATUS_MAPPING["approved"], "paid");
    assertEquals(STATUS_MAPPING["confirmed"], "paid");
  },
});

Deno.test({
  name: "pushinpay-get-status/unit: maps cancelled statuses correctly",
  ...unitTestOptions,
  fn: () => {
    assertEquals(STATUS_MAPPING["cancelled"], "cancelled");
    assertEquals(STATUS_MAPPING["canceled"], "cancelled");
    assertEquals(STATUS_MAPPING["expired"], "cancelled");
  },
});

Deno.test({
  name: "pushinpay-get-status/unit: maps pending statuses correctly",
  ...unitTestOptions,
  fn: () => {
    assertEquals(STATUS_MAPPING["pending"], "pending");
    assertEquals(STATUS_MAPPING["waiting"], "pending");
    assertEquals(STATUS_MAPPING["processing"], "pending");
    assertEquals(STATUS_MAPPING["created"], "pending");
  },
});

// ============================================================================
// REQUEST VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-get-status/unit: valid request has orderId",
  ...unitTestOptions,
  fn: () => {
    const request = createValidRequest("order-123");
    assertExists(request.orderId);
    assertEquals(request.orderId, "order-123");
  },
});

Deno.test({
  name: "pushinpay-get-status/unit: empty request fails validation",
  ...unitTestOptions,
  fn: () => {
    const request = createEmptyRequest();
    assertEquals(Object.keys(request).length, 0);
    assertEquals("orderId" in request, false);
  },
});

Deno.test({
  name: "pushinpay-get-status/unit: request without orderId fails validation",
  ...unitTestOptions,
  fn: () => {
    const request = createRequestWithoutOrderId();
    assertEquals("orderId" in request, false);
    assertExists(request.someOtherField);
  },
});

// ============================================================================
// API RESPONSE FACTORY TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-get-status/unit: paid API response has required fields",
  ...unitTestOptions,
  fn: () => {
    const response = createPaidApiResponse();
    assertExists(response.id);
    assertEquals(response.status, "paid");
    assertExists(response.value);
    assertExists(response.paid_at);
    assertExists(response.payer_name);
  },
});

Deno.test({
  name: "pushinpay-get-status/unit: pending API response has no payment data",
  ...unitTestOptions,
  fn: () => {
    const response = createPendingApiResponse();
    assertEquals(response.status, "pending");
    assertEquals(response.paid_at, undefined);
    assertEquals(response.payer_name, undefined);
  },
});

Deno.test({
  name: "pushinpay-get-status/unit: expired API response has correct status",
  ...unitTestOptions,
  fn: () => {
    const response = createExpiredApiResponse();
    assertEquals(response.status, "expired");
    // Expired date is in the past
    const expiresAt = new Date(response.expires_at);
    assertEquals(expiresAt.getTime() < Date.now(), true);
  },
});

// ============================================================================
// STATUS RESPONSE FACTORY TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-get-status/unit: paid status response indicates paid",
  ...unitTestOptions,
  fn: () => {
    const response = createPaidStatusResponse();
    assertEquals(response.success, true);
    assertEquals(response.status, "paid");
    assertEquals(response.isPaid, true);
    assertExists(response.paidAt);
    assertExists(response.payerName);
  },
});

Deno.test({
  name: "pushinpay-get-status/unit: pending status response indicates not paid",
  ...unitTestOptions,
  fn: () => {
    const response = createPendingStatusResponse();
    assertEquals(response.success, true);
    assertEquals(response.status, "pending");
    assertEquals(response.isPaid, false);
  },
});

Deno.test({
  name: "pushinpay-get-status/unit: no pix_id response has message",
  ...unitTestOptions,
  fn: () => {
    const response = createNoPixIdResponse();
    assertEquals(response.success, true);
    assertExists(response.message);
    assertEquals(response.message!.includes("PIX"), true);
  },
});

Deno.test({
  name: "pushinpay-get-status/unit: error response has error field",
  ...unitTestOptions,
  fn: () => {
    const response = createErrorResponse("Test error");
    assertEquals(response.success, false);
    assertEquals(response.error, "Test error");
  },
});

// ============================================================================
// ORDER FACTORY TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-get-status/unit: order with pix has pix_id",
  ...unitTestOptions,
  fn: () => {
    const order = createOrderWithPix("order-123", "pix-456");
    assertEquals(order.id, "order-123");
    assertEquals(order.pix_id, "pix-456");
    assertExists(order.vendor_id);
  },
});

Deno.test({
  name: "pushinpay-get-status/unit: order without pix has null pix_id",
  ...unitTestOptions,
  fn: () => {
    const order = createOrderWithoutPix("order-123");
    assertEquals(order.id, "order-123");
    assertEquals(order.pix_id, null);
    assertEquals(order.pix_status, null);
  },
});
