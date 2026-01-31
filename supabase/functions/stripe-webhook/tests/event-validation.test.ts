/**
 * Event Validation Tests for stripe-webhook
 * 
 * @module stripe-webhook/tests/event-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertMatch } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { validateWebhookEvent } from "./_shared.ts";

// ============================================================================
// EVENT VALIDATION TESTS
// ============================================================================

Deno.test("stripe-webhook - Event Validation - should reject null event", () => {
  const result = validateWebhookEvent(null);
  assertEquals(result.valid, false);
});

Deno.test("stripe-webhook - Event Validation - should reject non-object event", () => {
  const result = validateWebhookEvent('string');
  assertEquals(result.valid, false);
});

Deno.test("stripe-webhook - Event Validation - should reject missing id", () => {
  const event = { type: 'payment_intent.succeeded', data: { object: {} } };
  const result = validateWebhookEvent(event);
  assertEquals(result.valid, false);
  assertMatch(result.error!, /id/);
});

Deno.test("stripe-webhook - Event Validation - should reject missing type", () => {
  const event = { id: 'evt_123', data: { object: {} } };
  const result = validateWebhookEvent(event);
  assertEquals(result.valid, false);
  assertMatch(result.error!, /type/);
});

Deno.test("stripe-webhook - Event Validation - should reject missing data", () => {
  const event = { id: 'evt_123', type: 'payment_intent.succeeded' };
  const result = validateWebhookEvent(event);
  assertEquals(result.valid, false);
  assertMatch(result.error!, /data/);
});

Deno.test("stripe-webhook - Event Validation - should reject missing data.object", () => {
  const event = { id: 'evt_123', type: 'payment_intent.succeeded', data: {} };
  const result = validateWebhookEvent(event);
  assertEquals(result.valid, false);
});

Deno.test("stripe-webhook - Event Validation - should accept valid event", () => {
  const event = {
    id: 'evt_123',
    type: 'payment_intent.succeeded',
    data: { object: { id: 'pi_123' } },
    created: Date.now(),
    livemode: false,
  };
  const result = validateWebhookEvent(event);
  assertEquals(result.valid, true);
});
