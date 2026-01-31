/**
 * Event Processing Tests for stripe-webhook
 * 
 * @module stripe-webhook/tests/event-processing.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { buildProcessedResult, StripeWebhookEvent } from "./_shared.ts";

// ============================================================================
// EVENT PROCESSING TESTS
// ============================================================================

Deno.test("stripe-webhook - Event Processing - should process payment_intent.succeeded", () => {
  const event: StripeWebhookEvent = {
    id: 'evt_123',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_123',
        metadata: { order_id: 'order-abc' },
        amount: 10000,
      },
    },
    created: Date.now(),
    livemode: false,
  };

  const result = buildProcessedResult(event);
  assertEquals(result.success, true);
  assertEquals(result.orderId, 'order-abc');
  assertEquals(result.newStatus, 'approved');
});

Deno.test("stripe-webhook - Event Processing - should process checkout.session.completed", () => {
  const event: StripeWebhookEvent = {
    id: 'evt_456',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_123',
        client_reference_id: 'order-xyz',
        amount_total: 20000,
      },
    },
    created: Date.now(),
    livemode: false,
  };

  const result = buildProcessedResult(event);
  assertEquals(result.success, true);
  assertEquals(result.orderId, 'order-xyz');
  assertEquals(result.newStatus, 'approved');
});

Deno.test("stripe-webhook - Event Processing - should mark dispute as requires action", () => {
  const event: StripeWebhookEvent = {
    id: 'evt_789',
    type: 'charge.dispute.created',
    data: {
      object: {
        id: 'dp_123',
        metadata: { order_id: 'order-disputed' },
      },
    },
    created: Date.now(),
    livemode: false,
  };

  const result = buildProcessedResult(event);
  assertEquals(result.success, true);
  assertEquals(result.newStatus, 'disputed');
  assertEquals(result.requiresAction, true);
});

Deno.test("stripe-webhook - Event Processing - should skip informational events", () => {
  const event: StripeWebhookEvent = {
    id: 'evt_skip',
    type: 'customer.created',
    data: { object: { id: 'cus_123' } },
    created: Date.now(),
    livemode: false,
  };

  const result = buildProcessedResult(event);
  assertEquals(result.success, true);
  assertEquals(result.message, 'Evento ignorado: customer.created');
});

Deno.test("stripe-webhook - Event Processing - should reject unsupported events", () => {
  const event: StripeWebhookEvent = {
    id: 'evt_unsupported',
    type: 'unknown.event.type',
    data: { object: {} },
    created: Date.now(),
    livemode: false,
  };

  const result = buildProcessedResult(event);
  assertEquals(result.success, false);
  assertEquals(result.message, 'Evento não suportado: unknown.event.type');
});
