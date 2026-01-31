/**
 * Webhook & Access Actions Tests for order-lifecycle-worker
 * 
 * @module order-lifecycle-worker/tests/actions.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  determineWebhookAction, 
  determineAccessAction, 
  shouldSendEmail,
  MOCK_EVENT, 
  MOCK_ORDER 
} from "./_shared.ts";

// ============================================================================
// WEBHOOK ACTION TESTS
// ============================================================================

Deno.test("order-lifecycle-worker - Webhook - should determine purchase_approved action", () => {
  const action = determineWebhookAction({ ...MOCK_EVENT, event_type: 'payment.approved' });
  assertExists(action);
  assertEquals(action!.type, 'purchase_approved');
  assertEquals(action!.priority, 'high');
});

Deno.test("order-lifecycle-worker - Webhook - should determine purchase_refunded action", () => {
  const action = determineWebhookAction({ ...MOCK_EVENT, event_type: 'payment.refunded' });
  assertExists(action);
  assertEquals(action!.type, 'purchase_refunded');
  assertEquals(action!.priority, 'normal');
});

Deno.test("order-lifecycle-worker - Webhook - should determine purchase_chargeback action", () => {
  const action = determineWebhookAction({ ...MOCK_EVENT, event_type: 'payment.chargeback' });
  assertExists(action);
  assertEquals(action!.type, 'purchase_chargeback');
  assertEquals(action!.priority, 'high');
});

Deno.test("order-lifecycle-worker - Webhook - should return null for payment.expired", () => {
  const action = determineWebhookAction({ ...MOCK_EVENT, event_type: 'payment.expired' });
  assertEquals(action, null);
});

// ============================================================================
// ACCESS ACTION TESTS
// ============================================================================

Deno.test("order-lifecycle-worker - Access - should grant access on payment.approved", () => {
  const action = determineAccessAction({ ...MOCK_EVENT, event_type: 'payment.approved' }, MOCK_ORDER);
  assertExists(action);
  assertEquals(action!.type, 'grant');
  assertEquals(action!.buyerEmail, 'buyer@example.com');
  assertEquals(action!.productId, 'prod-123');
});

Deno.test("order-lifecycle-worker - Access - should revoke access on payment.refunded", () => {
  const action = determineAccessAction({ ...MOCK_EVENT, event_type: 'payment.refunded' }, MOCK_ORDER);
  assertExists(action);
  assertEquals(action!.type, 'revoke');
  assertEquals(action!.reason, 'Refund processed');
});

Deno.test("order-lifecycle-worker - Access - should revoke access on payment.chargeback", () => {
  const action = determineAccessAction({ ...MOCK_EVENT, event_type: 'payment.chargeback' }, MOCK_ORDER);
  assertExists(action);
  assertEquals(action!.type, 'revoke');
  assertEquals(action!.reason, 'Chargeback received');
});

Deno.test("order-lifecycle-worker - Access - should return null if no customer_email", () => {
  const orderNoEmail = { ...MOCK_ORDER, customer_email: null };
  const action = determineAccessAction(MOCK_EVENT, orderNoEmail);
  assertEquals(action, null);
});

// ============================================================================
// EMAIL TRIGGER TESTS
// ============================================================================

Deno.test("order-lifecycle-worker - Email - should send on payment.approved", () => {
  assertEquals(shouldSendEmail('payment.approved'), true);
});

Deno.test("order-lifecycle-worker - Email - should send on payment.refunded", () => {
  assertEquals(shouldSendEmail('payment.refunded'), true);
});

Deno.test("order-lifecycle-worker - Email - should not send on payment.cancelled", () => {
  assertEquals(shouldSendEmail('payment.cancelled'), false);
});

Deno.test("order-lifecycle-worker - Email - should not send on payment.expired", () => {
  assertEquals(shouldSendEmail('payment.expired'), false);
});
