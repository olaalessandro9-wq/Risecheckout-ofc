/**
 * Batch Processing Tests for data-retention-executor
 * 
 * @module data-retention-executor/tests/batch-processing.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  calculateTotal, 
  filterByCategory, 
  aggregateResults,
  formatError,
  handleException 
} from "./_shared.ts";
import type { CleanupResult } from "./_shared.ts";

// ============================================================================
// TOTAL CALCULATION TESTS
// ============================================================================

Deno.test("Total calculation - should sum correctly", () => {
  const results: CleanupResult[] = [
    { category: 'oauth', table_name: 'oauth_states', rows_deleted: 100 },
    { category: 'sessions', table_name: 'sessions', rows_deleted: 250 },
    { category: 'debug', table_name: 'trigger_debug_logs', rows_deleted: 50 }
  ];

  assertEquals(calculateTotal(results), 400);
});

Deno.test("Total calculation - should handle empty array", () => {
  assertEquals(calculateTotal([]), 0);
});

Deno.test("Total calculation - single item", () => {
  const results: CleanupResult[] = [
    { category: 'oauth', table_name: 'oauth_states', rows_deleted: 42 }
  ];
  assertEquals(calculateTotal(results), 42);
});

// ============================================================================
// CATEGORY FILTER TESTS
// ============================================================================

Deno.test("Category filter - should filter results", () => {
  const allResults: CleanupResult[] = [
    { category: 'oauth', table_name: 'oauth_states', rows_deleted: 100 },
    { category: 'sessions', table_name: 'sessions', rows_deleted: 200 },
    { category: 'oauth', table_name: 'oauth_tokens', rows_deleted: 50 }
  ];

  const oauthResults = filterByCategory(allResults, 'oauth');
  assertEquals(oauthResults.length, 2);
  assertEquals(oauthResults.every(r => r.category === 'oauth'), true);
});

Deno.test("Category filter - non-existent category returns empty", () => {
  const results: CleanupResult[] = [
    { category: 'oauth', table_name: 'oauth_states', rows_deleted: 100 }
  ];

  const filtered = filterByCategory(results, 'nonexistent');
  assertEquals(filtered.length, 0);
});

// ============================================================================
// BATCH PROCESSING TESTS
// ============================================================================

Deno.test("Batch processing - should aggregate results", () => {
  const results: CleanupResult[] = [
    { category: 'security', table_name: 'security_events', rows_deleted: 100 },
    { category: 'security', table_name: 'security_audit_log', rows_deleted: 50 }
  ];

  const aggregated = aggregateResults(results);
  assertEquals(aggregated.length, 1);
  assertEquals(aggregated[0].tables.length, 2);
});

Deno.test("Batch processing - multiple categories", () => {
  const results: CleanupResult[] = [
    { category: 'oauth', table_name: 'oauth_states', rows_deleted: 100 },
    { category: 'sessions', table_name: 'sessions', rows_deleted: 200 },
    { category: 'oauth', table_name: 'oauth_tokens', rows_deleted: 50 }
  ];

  const aggregated = aggregateResults(results);
  assertEquals(aggregated.length, 2);
  
  const oauthBatch = aggregated.find(a => a.category === 'oauth');
  assertEquals(oauthBatch?.tables.length, 2);
});

Deno.test("Batch processing - empty input", () => {
  const aggregated = aggregateResults([]);
  assertEquals(aggregated.length, 0);
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test("Error handling - should format RPC errors", () => {
  const error = new Error("Database timeout");
  assertEquals(formatError(error), "RPC error: Database timeout");
});

Deno.test("Error handling - should catch exceptions", () => {
  assertEquals(handleException(new Error("Test")), "Exception: Test");
  assertEquals(handleException("string error"), "Exception: string error");
});

Deno.test("Error handling - null exception", () => {
  assertEquals(handleException(null), "Exception: null");
});

Deno.test("Error handling - undefined exception", () => {
  assertEquals(handleException(undefined), "Exception: undefined");
});
