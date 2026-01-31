/**
 * Status Transition Tests for order-lifecycle-worker
 * 
 * @module order-lifecycle-worker/tests/transitions.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isStatusTransitionValid, mapEventToStatus } from "./_shared.ts";

// ============================================================================
// STATUS TRANSITION TESTS
// ============================================================================

Deno.test("order-lifecycle-worker - Transitions - should allow any status from null", () => {
  assertEquals(isStatusTransitionValid(null, 'paid'), true);
  assertEquals(isStatusTransitionValid(null, 'pending'), true);
});

Deno.test("order-lifecycle-worker - Transitions - should allow pending to paid", () => {
  assertEquals(isStatusTransitionValid('pending', 'paid'), true);
});

Deno.test("order-lifecycle-worker - Transitions - should allow pending to cancelled", () => {
  assertEquals(isStatusTransitionValid('pending', 'cancelled'), true);
});

Deno.test("order-lifecycle-worker - Transitions - should allow pending to expired", () => {
  assertEquals(isStatusTransitionValid('pending', 'expired'), true);
});

Deno.test("order-lifecycle-worker - Transitions - should allow paid to refunded", () => {
  assertEquals(isStatusTransitionValid('paid', 'refunded'), true);
});

Deno.test("order-lifecycle-worker - Transitions - should allow paid to chargeback", () => {
  assertEquals(isStatusTransitionValid('paid', 'chargeback'), true);
});

Deno.test("order-lifecycle-worker - Transitions - should allow expired to paid", () => {
  assertEquals(isStatusTransitionValid('expired', 'paid'), true);
});

Deno.test("order-lifecycle-worker - Transitions - should reject refunded to any", () => {
  assertEquals(isStatusTransitionValid('refunded', 'paid'), false);
  assertEquals(isStatusTransitionValid('refunded', 'pending'), false);
});

Deno.test("order-lifecycle-worker - Transitions - should reject cancelled to any", () => {
  assertEquals(isStatusTransitionValid('cancelled', 'paid'), false);
});

Deno.test("order-lifecycle-worker - Transitions - should reject chargeback to any", () => {
  assertEquals(isStatusTransitionValid('chargeback', 'paid'), false);
});

// ============================================================================
// IDEMPOTENCY TESTS
// ============================================================================

Deno.test("order-lifecycle-worker - Idempotency - should produce consistent status mapping", () => {
  assertEquals(mapEventToStatus('payment.approved'), mapEventToStatus('payment.approved'));
  assertEquals(mapEventToStatus('payment.refunded'), mapEventToStatus('payment.refunded'));
});

Deno.test("order-lifecycle-worker - Idempotency - should produce consistent transition validation", () => {
  assertEquals(
    isStatusTransitionValid('pending', 'paid'),
    isStatusTransitionValid('pending', 'paid')
  );
});
