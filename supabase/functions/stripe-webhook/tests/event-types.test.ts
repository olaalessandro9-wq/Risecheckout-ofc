/**
 * Event Type Handling Tests for stripe-webhook
 * 
 * @module stripe-webhook/tests/event-types.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { isHandledEventType } from "./_shared.ts";

// ============================================================================
// EVENT TYPE HANDLING TESTS
// ============================================================================

Deno.test("stripe-webhook - Event Type Handling - should handle checkout.session.completed", () => {
  assertEquals(isHandledEventType('checkout.session.completed'), true);
});

Deno.test("stripe-webhook - Event Type Handling - should handle payment_intent.succeeded", () => {
  assertEquals(isHandledEventType('payment_intent.succeeded'), true);
});

Deno.test("stripe-webhook - Event Type Handling - should handle payment_intent.payment_failed", () => {
  assertEquals(isHandledEventType('payment_intent.payment_failed'), true);
});

Deno.test("stripe-webhook - Event Type Handling - should handle charge.refunded", () => {
  assertEquals(isHandledEventType('charge.refunded'), true);
});

Deno.test("stripe-webhook - Event Type Handling - should handle charge.dispute.created", () => {
  assertEquals(isHandledEventType('charge.dispute.created'), true);
});

Deno.test("stripe-webhook - Event Type Handling - should handle subscription events", () => {
  assertEquals(isHandledEventType('customer.subscription.created'), true);
  assertEquals(isHandledEventType('customer.subscription.updated'), true);
  assertEquals(isHandledEventType('customer.subscription.deleted'), true);
});

Deno.test("stripe-webhook - Event Type Handling - should handle invoice events", () => {
  assertEquals(isHandledEventType('invoice.paid'), true);
  assertEquals(isHandledEventType('invoice.payment_failed'), true);
});

Deno.test("stripe-webhook - Event Type Handling - should not handle unknown events", () => {
  assertEquals(isHandledEventType('unknown.event'), false);
  assertEquals(isHandledEventType(''), false);
});
