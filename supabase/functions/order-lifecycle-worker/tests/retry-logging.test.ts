/**
 * Retry Logic & Event Logging Tests for order-lifecycle-worker
 * 
 * @module order-lifecycle-worker/tests/retry-logging.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { calculateRetryDelay, shouldRetry, buildEventLogEntry, MOCK_EVENT } from "./_shared.ts";

// ============================================================================
// RETRY LOGIC TESTS
// ============================================================================

Deno.test("order-lifecycle-worker - Retry - should calculate exponential delay", () => {
  assertEquals(calculateRetryDelay(0, 1000), 1000);
  assertEquals(calculateRetryDelay(1, 1000), 2000);
  assertEquals(calculateRetryDelay(2, 1000), 4000);
  assertEquals(calculateRetryDelay(3, 1000), 8000);
});

Deno.test("order-lifecycle-worker - Retry - should cap delay at 5 minutes", () => {
  assertEquals(calculateRetryDelay(10, 1000), 300000);
  assertEquals(calculateRetryDelay(20, 1000), 300000);
});

Deno.test("order-lifecycle-worker - Retry - should allow retry within limits", () => {
  assertEquals(shouldRetry(0, 5), true);
  assertEquals(shouldRetry(4, 5), true);
});

Deno.test("order-lifecycle-worker - Retry - should stop retry at max attempts", () => {
  assertEquals(shouldRetry(5, 5), false);
  assertEquals(shouldRetry(6, 5), false);
});

// ============================================================================
// EVENT LOG BUILDING TESTS
// ============================================================================

Deno.test("order-lifecycle-worker - Log - should build success log entry", () => {
  const log = buildEventLogEntry(MOCK_EVENT, true);
  assertEquals(log.event_id, 'evt-123');
  assertEquals(log.order_id, 'order-456');
  assertEquals(log.event_type, 'payment.approved');
  assertEquals(log.success, true);
  assertEquals(log.error, null);
  assertExists(log.processed_at);
});

Deno.test("order-lifecycle-worker - Log - should build error log entry", () => {
  const log = buildEventLogEntry(MOCK_EVENT, false, 'Connection timeout');
  assertEquals(log.success, false);
  assertEquals(log.error, 'Connection timeout');
});
