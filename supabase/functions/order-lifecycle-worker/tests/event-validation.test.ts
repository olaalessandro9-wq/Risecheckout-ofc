/**
 * Event Validation Tests for order-lifecycle-worker
 * 
 * @module order-lifecycle-worker/tests/event-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidEventType, isValidOrderStatus } from "./_shared.ts";

// ============================================================================
// EVENT TYPE VALIDATION TESTS
// ============================================================================

Deno.test("order-lifecycle-worker - Event Validation - should accept valid event types", () => {
  assertEquals(isValidEventType('payment.approved'), true);
  assertEquals(isValidEventType('payment.refunded'), true);
  assertEquals(isValidEventType('payment.cancelled'), true);
  assertEquals(isValidEventType('payment.chargeback'), true);
  assertEquals(isValidEventType('payment.expired'), true);
});

Deno.test("order-lifecycle-worker - Event Validation - should reject invalid event types", () => {
  assertEquals(isValidEventType('payment.unknown'), false);
  assertEquals(isValidEventType('invalid'), false);
  assertEquals(isValidEventType(''), false);
  assertEquals(isValidEventType(null), false);
  assertEquals(isValidEventType(undefined), false);
  assertEquals(isValidEventType(123), false);
});

// ============================================================================
// ORDER STATUS VALIDATION TESTS
// ============================================================================

Deno.test("order-lifecycle-worker - Status Validation - should accept valid statuses", () => {
  assertEquals(isValidOrderStatus('pending'), true);
  assertEquals(isValidOrderStatus('paid'), true);
  assertEquals(isValidOrderStatus('refunded'), true);
  assertEquals(isValidOrderStatus('cancelled'), true);
  assertEquals(isValidOrderStatus('chargeback'), true);
  assertEquals(isValidOrderStatus('expired'), true);
});

Deno.test("order-lifecycle-worker - Status Validation - should reject invalid statuses", () => {
  assertEquals(isValidOrderStatus('unknown'), false);
  assertEquals(isValidOrderStatus('processing'), false);
  assertEquals(isValidOrderStatus(''), false);
  assertEquals(isValidOrderStatus(null), false);
});
