/**
 * Status Mapping Tests for stripe-webhook
 * 
 * @module stripe-webhook/tests/status-mapping.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { mapStripeEventToOrderStatus, shouldSkipEvent } from "./_shared.ts";

// ============================================================================
// STATUS MAPPING TESTS
// ============================================================================

Deno.test("stripe-webhook - Status Mapping - should map checkout.session.completed to approved", () => {
  assertEquals(mapStripeEventToOrderStatus('checkout.session.completed'), 'approved');
});

Deno.test("stripe-webhook - Status Mapping - should map payment_intent.succeeded to approved", () => {
  assertEquals(mapStripeEventToOrderStatus('payment_intent.succeeded'), 'approved');
});

Deno.test("stripe-webhook - Status Mapping - should map payment_intent.payment_failed to failed", () => {
  assertEquals(mapStripeEventToOrderStatus('payment_intent.payment_failed'), 'failed');
});

Deno.test("stripe-webhook - Status Mapping - should map charge.refunded to refunded", () => {
  assertEquals(mapStripeEventToOrderStatus('charge.refunded'), 'refunded');
});

Deno.test("stripe-webhook - Status Mapping - should map charge.dispute.created to disputed", () => {
  assertEquals(mapStripeEventToOrderStatus('charge.dispute.created'), 'disputed');
});

Deno.test("stripe-webhook - Status Mapping - should map subscription.deleted to cancelled", () => {
  assertEquals(mapStripeEventToOrderStatus('customer.subscription.deleted'), 'cancelled');
});

Deno.test("stripe-webhook - Status Mapping - should map invoice.paid to approved", () => {
  assertEquals(mapStripeEventToOrderStatus('invoice.paid'), 'approved');
});

// ============================================================================
// SKIP EVENTS TESTS
// ============================================================================

Deno.test("stripe-webhook - Skip Events - should skip customer.created", () => {
  assertEquals(shouldSkipEvent('customer.created'), true);
});

Deno.test("stripe-webhook - Skip Events - should skip customer.updated", () => {
  assertEquals(shouldSkipEvent('customer.updated'), true);
});

Deno.test("stripe-webhook - Skip Events - should skip payment_method.attached", () => {
  assertEquals(shouldSkipEvent('payment_method.attached'), true);
});

Deno.test("stripe-webhook - Skip Events - should not skip payment events", () => {
  assertEquals(shouldSkipEvent('payment_intent.succeeded'), false);
  assertEquals(shouldSkipEvent('checkout.session.completed'), false);
});
