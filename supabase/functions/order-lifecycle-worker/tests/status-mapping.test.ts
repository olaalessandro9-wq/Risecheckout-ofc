/**
 * Status Mapping Tests for order-lifecycle-worker
 * 
 * @module order-lifecycle-worker/tests/status-mapping.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mapEventToStatus } from "./_shared.ts";

// ============================================================================
// EVENT TO STATUS MAPPING TESTS
// ============================================================================

Deno.test("order-lifecycle-worker - Mapping - should map payment.approved to paid", () => {
  assertEquals(mapEventToStatus('payment.approved'), 'paid');
});

Deno.test("order-lifecycle-worker - Mapping - should map payment.refunded to refunded", () => {
  assertEquals(mapEventToStatus('payment.refunded'), 'refunded');
});

Deno.test("order-lifecycle-worker - Mapping - should map payment.cancelled to cancelled", () => {
  assertEquals(mapEventToStatus('payment.cancelled'), 'cancelled');
});

Deno.test("order-lifecycle-worker - Mapping - should map payment.chargeback to chargeback", () => {
  assertEquals(mapEventToStatus('payment.chargeback'), 'chargeback');
});

Deno.test("order-lifecycle-worker - Mapping - should map payment.expired to expired", () => {
  assertEquals(mapEventToStatus('payment.expired'), 'expired');
});
