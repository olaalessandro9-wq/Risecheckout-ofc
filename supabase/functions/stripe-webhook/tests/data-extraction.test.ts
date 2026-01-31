/**
 * Data Extraction Tests for stripe-webhook
 * 
 * @module stripe-webhook/tests/data-extraction.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  extractOrderIdFromMetadata,
  extractAmountFromEvent,
  isTestEvent,
  StripeWebhookEvent,
} from "./_shared.ts";

// ============================================================================
// ORDER ID EXTRACTION TESTS
// ============================================================================

Deno.test("stripe-webhook - Order ID Extraction - should extract from metadata.order_id", () => {
  const dataObject = { metadata: { order_id: 'order-123-abc' } };
  const orderId = extractOrderIdFromMetadata(dataObject);
  assertEquals(orderId, 'order-123-abc');
});

Deno.test("stripe-webhook - Order ID Extraction - should extract from client_reference_id", () => {
  const dataObject = { client_reference_id: 'order-456-def' };
  const orderId = extractOrderIdFromMetadata(dataObject);
  assertEquals(orderId, 'order-456-def');
});

Deno.test("stripe-webhook - Order ID Extraction - should prefer metadata over client_reference_id", () => {
  const dataObject = {
    metadata: { order_id: 'from-metadata' },
    client_reference_id: 'from-client-ref',
  };
  const orderId = extractOrderIdFromMetadata(dataObject);
  assertEquals(orderId, 'from-metadata');
});

Deno.test("stripe-webhook - Order ID Extraction - should return null if no order id found", () => {
  const dataObject = { id: 'pi_123' };
  const orderId = extractOrderIdFromMetadata(dataObject);
  assertEquals(orderId, null);
});

// ============================================================================
// AMOUNT EXTRACTION TESTS
// ============================================================================

Deno.test("stripe-webhook - Amount Extraction - should extract amount_total from checkout session", () => {
  const dataObject = { amount_total: 10000 };
  const amount = extractAmountFromEvent('checkout.session.completed', dataObject);
  assertEquals(amount, 10000);
});

Deno.test("stripe-webhook - Amount Extraction - should extract amount from payment_intent", () => {
  const dataObject = { amount: 5000 };
  const amount = extractAmountFromEvent('payment_intent.succeeded', dataObject);
  assertEquals(amount, 5000);
});

Deno.test("stripe-webhook - Amount Extraction - should extract amount_refunded from charge.refunded", () => {
  const dataObject = { amount_refunded: 2500 };
  const amount = extractAmountFromEvent('charge.refunded', dataObject);
  assertEquals(amount, 2500);
});

Deno.test("stripe-webhook - Amount Extraction - should extract amount_paid from invoice", () => {
  const dataObject = { amount_paid: 15000 };
  const amount = extractAmountFromEvent('invoice.paid', dataObject);
  assertEquals(amount, 15000);
});

Deno.test("stripe-webhook - Amount Extraction - should return 0 for missing amount", () => {
  const dataObject = {};
  const amount = extractAmountFromEvent('payment_intent.succeeded', dataObject);
  assertEquals(amount, 0);
});

// ============================================================================
// TEST/LIVE MODE TESTS
// ============================================================================

Deno.test("stripe-webhook - Test/Live Mode - should identify test event", () => {
  const event: StripeWebhookEvent = {
    id: 'evt_test_123',
    type: 'payment_intent.succeeded',
    data: { object: {} },
    created: Date.now(),
    livemode: false,
  };
  assertEquals(isTestEvent(event), true);
});

Deno.test("stripe-webhook - Test/Live Mode - should identify live event", () => {
  const event: StripeWebhookEvent = {
    id: 'evt_live_123',
    type: 'payment_intent.succeeded',
    data: { object: {} },
    created: Date.now(),
    livemode: true,
  };
  assertEquals(isTestEvent(event), false);
});
