/**
 * Summary & Result Building Tests for reconcile-asaas
 * 
 * @module reconcile-asaas/tests/summary-results.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  calculateSummary,
  buildIdempotentSkipResult,
  buildCredentialErrorResult,
  buildApiErrorResult,
  buildApprovedResult,
  mockPendingOrder,
  MOCK_ORDER_ID,
  ReconcileResult,
} from "./_shared.ts";

// ============================================================================
// SUMMARY CALCULATION TESTS
// ============================================================================

Deno.test("reconcile-asaas - Summary Calculation - should calculate correct totals", () => {
  const results: ReconcileResult[] = [
    { order_id: "1", previous_status: "PENDING", new_status: "paid", action: "updated", reason: "OK" },
    { order_id: "2", previous_status: "PENDING", new_status: "PENDING", action: "skipped", reason: "Already processed" },
    { order_id: "3", previous_status: "PENDING", new_status: "PENDING", action: "error", reason: "API error" },
    { order_id: "4", previous_status: "PENDING", new_status: "paid", action: "updated", reason: "OK" },
  ];
  const summary = calculateSummary(results);
  assertEquals(summary.total, 4);
  assertEquals(summary.updated, 2);
  assertEquals(summary.skipped, 1);
  assertEquals(summary.errors, 1);
});

Deno.test("reconcile-asaas - Summary Calculation - should handle empty results", () => {
  const summary = calculateSummary([]);
  assertEquals(summary.total, 0);
  assertEquals(summary.updated, 0);
  assertEquals(summary.skipped, 0);
  assertEquals(summary.errors, 0);
});

Deno.test("reconcile-asaas - Summary Calculation - should handle all updated", () => {
  const results: ReconcileResult[] = Array(5).fill(null).map((_, i) => ({
    order_id: String(i),
    previous_status: "PENDING",
    new_status: "paid",
    action: "updated" as const,
    reason: "OK",
  }));
  const summary = calculateSummary(results);
  assertEquals(summary.total, 5);
  assertEquals(summary.updated, 5);
  assertEquals(summary.skipped, 0);
  assertEquals(summary.errors, 0);
});

// ============================================================================
// RESULT BUILDING TESTS
// ============================================================================

Deno.test("reconcile-asaas - Result Building - should build idempotent skip result", () => {
  const result = buildIdempotentSkipResult(mockPendingOrder);
  assertEquals(result.order_id, MOCK_ORDER_ID);
  assertEquals(result.action, "skipped");
  assertEquals(result.previous_status, mockPendingOrder.status);
  assertEquals(result.new_status, mockPendingOrder.status);
});

Deno.test("reconcile-asaas - Result Building - should build credential error result", () => {
  const result = buildCredentialErrorResult(mockPendingOrder);
  assertEquals(result.order_id, MOCK_ORDER_ID);
  assertEquals(result.action, "error");
  assertExists(result.reason);
});

Deno.test("reconcile-asaas - Result Building - should build API error result", () => {
  const result = buildApiErrorResult(mockPendingOrder);
  assertEquals(result.order_id, MOCK_ORDER_ID);
  assertEquals(result.action, "error");
});

Deno.test("reconcile-asaas - Result Building - should build approved result", () => {
  const result = buildApprovedResult(mockPendingOrder);
  assertEquals(result.order_id, MOCK_ORDER_ID);
  assertEquals(result.action, "updated");
  assertEquals(result.new_status, "paid");
});
