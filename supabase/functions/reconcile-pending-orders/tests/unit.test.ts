/**
 * Unit Tests - Business Logic
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 1: Pure business logic tests with mocks
 * Execution: ALWAYS (no dependencies on real services)
 * 
 * @module reconcile-pending-orders/tests/unit
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  unitTestOptions,
  MAX_ORDERS_PER_RUN,
  MIN_AGE_MINUTES,
  MAX_AGE_HOURS,
  INTERNAL_SECRET_HEADER,
  createAuthHeaders,
  createUnauthHeaders,
  createInvalidSecretHeaders,
  createMercadoPagoPendingOrder,
  createAsaasPendingOrder,
  createUnsupportedGatewayOrder,
  createOrderWithoutPaymentId,
  createUpdatedResult,
  createSkippedResult,
  createErrorResult,
  createEmptyReconcileResponse,
  createSuccessReconcileResponse,
  isOrderInValidAgeRange,
  isGatewaySupported,
  groupOrdersByGateway,
} from "./_shared.ts";

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

Deno.test({
  name: "reconcile-pending-orders/unit: MAX_ORDERS_PER_RUN is 50",
  ...unitTestOptions,
  fn: () => {
    assertEquals(MAX_ORDERS_PER_RUN, 50);
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: MIN_AGE_MINUTES is 3",
  ...unitTestOptions,
  fn: () => {
    assertEquals(MIN_AGE_MINUTES, 3);
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: MAX_AGE_HOURS is 24",
  ...unitTestOptions,
  fn: () => {
    assertEquals(MAX_AGE_HOURS, 24);
  },
});

// ============================================================================
// HEADERS TESTS
// ============================================================================

Deno.test({
  name: "reconcile-pending-orders/unit: auth headers have secret",
  ...unitTestOptions,
  fn: () => {
    const headers = createAuthHeaders();
    assertExists(headers[INTERNAL_SECRET_HEADER]);
    assertExists(headers["Content-Type"]);
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: unauth headers have no secret",
  ...unitTestOptions,
  fn: () => {
    const headers = createUnauthHeaders();
    assertEquals(headers[INTERNAL_SECRET_HEADER], undefined);
    assertExists(headers["Content-Type"]);
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: invalid secret headers have wrong value",
  ...unitTestOptions,
  fn: () => {
    const headers = createInvalidSecretHeaders();
    assertEquals(headers[INTERNAL_SECRET_HEADER], "invalid-secret");
  },
});

// ============================================================================
// ORDER FACTORY TESTS
// ============================================================================

Deno.test({
  name: "reconcile-pending-orders/unit: mercadopago order has correct gateway",
  ...unitTestOptions,
  fn: () => {
    const order = createMercadoPagoPendingOrder();
    assertEquals(order.gateway, "mercadopago");
    assertExists(order.gateway_payment_id);
    assertEquals(order.status, "PENDING");
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: asaas order has correct gateway",
  ...unitTestOptions,
  fn: () => {
    const order = createAsaasPendingOrder();
    assertEquals(order.gateway, "asaas");
    assertExists(order.gateway_payment_id);
    assertEquals(order.status, "PENDING");
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: unsupported gateway order is created",
  ...unitTestOptions,
  fn: () => {
    const order = createUnsupportedGatewayOrder("order-1", "stripe");
    assertEquals(order.gateway, "stripe");
    assertEquals(order.gateway_payment_id, null);
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: order without payment_id is created",
  ...unitTestOptions,
  fn: () => {
    const order = createOrderWithoutPaymentId("mercadopago");
    assertEquals(order.gateway, "mercadopago");
    assertEquals(order.gateway_payment_id, null);
  },
});

// ============================================================================
// RESULT FACTORY TESTS
// ============================================================================

Deno.test({
  name: "reconcile-pending-orders/unit: updated result has correct action",
  ...unitTestOptions,
  fn: () => {
    const result = createUpdatedResult("order-123", "PAID");
    assertEquals(result.action, "updated");
    assertEquals(result.new_status, "PAID");
    assertEquals(result.previous_status, "PENDING");
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: skipped result has correct action",
  ...unitTestOptions,
  fn: () => {
    const result = createSkippedResult("order-123", "Gateway not supported");
    assertEquals(result.action, "skipped");
    assertEquals(result.reason, "Gateway not supported");
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: error result has correct action",
  ...unitTestOptions,
  fn: () => {
    const result = createErrorResult("order-123", "API error");
    assertEquals(result.action, "error");
    assertEquals(result.reason, "API error");
  },
});

// ============================================================================
// RESPONSE FACTORY TESTS
// ============================================================================

Deno.test({
  name: "reconcile-pending-orders/unit: empty response has zero processed",
  ...unitTestOptions,
  fn: () => {
    const response = createEmptyReconcileResponse();
    assertEquals(response.success, true);
    assertEquals(response.processed, 0);
    assertExists(response.message);
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: success response has summary",
  ...unitTestOptions,
  fn: () => {
    const results = [
      createUpdatedResult("order-1"),
      createSkippedResult("order-2", "Reason"),
      createErrorResult("order-3", "Error"),
    ];
    const response = createSuccessReconcileResponse(results);
    
    assertEquals(response.success, true);
    assertExists(response.summary);
    assertEquals(response.summary!.total, 3);
    assertEquals(response.summary!.updated, 1);
    assertEquals(response.summary!.skipped, 1);
    assertEquals(response.summary!.errors, 1);
  },
});

// ============================================================================
// VALIDATION HELPER TESTS
// ============================================================================

Deno.test({
  name: "reconcile-pending-orders/unit: order too new fails age check",
  ...unitTestOptions,
  fn: () => {
    const now = new Date();
    const result = isOrderInValidAgeRange(now);
    assertEquals(result, false);
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: order too old fails age check",
  ...unitTestOptions,
  fn: () => {
    const veryOld = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
    const result = isOrderInValidAgeRange(veryOld);
    assertEquals(result, false);
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: order in valid range passes",
  ...unitTestOptions,
  fn: () => {
    const validAge = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    const result = isOrderInValidAgeRange(validAge);
    assertEquals(result, true);
  },
});

// ============================================================================
// GATEWAY SUPPORT TESTS
// ============================================================================

Deno.test({
  name: "reconcile-pending-orders/unit: mercadopago is supported",
  ...unitTestOptions,
  fn: () => {
    assertEquals(isGatewaySupported("mercadopago"), true);
    assertEquals(isGatewaySupported("MERCADOPAGO"), true);
    assertEquals(isGatewaySupported("MercadoPago"), true);
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: asaas is supported",
  ...unitTestOptions,
  fn: () => {
    assertEquals(isGatewaySupported("asaas"), true);
    assertEquals(isGatewaySupported("ASAAS"), true);
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: other gateways are not supported",
  ...unitTestOptions,
  fn: () => {
    assertEquals(isGatewaySupported("stripe"), false);
    assertEquals(isGatewaySupported("pagarme"), false);
    assertEquals(isGatewaySupported(null), false);
  },
});

// ============================================================================
// GROUP BY GATEWAY TESTS
// ============================================================================

Deno.test({
  name: "reconcile-pending-orders/unit: groups orders by gateway correctly",
  ...unitTestOptions,
  fn: () => {
    const orders = [
      createMercadoPagoPendingOrder("mp-1"),
      createMercadoPagoPendingOrder("mp-2"),
      createAsaasPendingOrder("asaas-1"),
      createUnsupportedGatewayOrder("other-1"),
      createOrderWithoutPaymentId("mercadopago"),
    ];
    
    const grouped = groupOrdersByGateway(orders);
    
    assertEquals(grouped.mercadopago.length, 2);
    assertEquals(grouped.asaas.length, 1);
    assertEquals(grouped.unsupported.length, 2); // Other + no payment_id
  },
});

Deno.test({
  name: "reconcile-pending-orders/unit: empty order list groups correctly",
  ...unitTestOptions,
  fn: () => {
    const grouped = groupOrdersByGateway([]);
    
    assertEquals(grouped.mercadopago.length, 0);
    assertEquals(grouped.asaas.length, 0);
    assertEquals(grouped.unsupported.length, 0);
  },
});
