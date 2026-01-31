/**
 * Execution Results Tests for data-retention-executor
 * 
 * @module data-retention-executor/tests/execution-results.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { CleanupResult, DryRunResult, CleanupExecutionResult, DryRunExecutionResult } from "./_shared.ts";

// ============================================================================
// CLEANUP RESULT TESTS
// ============================================================================

Deno.test("CleanupResult - should have correct structure", () => {
  const result: CleanupResult = {
    category: 'oauth',
    table_name: 'oauth_states',
    rows_deleted: 150
  };

  assertExists(result.category);
  assertExists(result.table_name);
  assertEquals(typeof result.rows_deleted, 'number');
  assertEquals(result.rows_deleted >= 0, true);
});

Deno.test("CleanupResult - should allow zero rows", () => {
  const result: CleanupResult = {
    category: 'sessions',
    table_name: 'sessions',
    rows_deleted: 0
  };

  assertEquals(result.rows_deleted, 0);
});

// ============================================================================
// DRY RUN RESULT TESTS
// ============================================================================

Deno.test("DryRunResult - should preview without deleting", () => {
  const result: DryRunResult = {
    category: 'gdpr',
    table_name: 'gdpr_requests',
    rows_to_delete: 50
  };

  assertExists(result.rows_to_delete);
  assertEquals(result.rows_to_delete, 50);
});

Deno.test("DryRunResult - should have category and table", () => {
  const result: DryRunResult = {
    category: 'sessions',
    table_name: 'user_sessions',
    rows_to_delete: 100
  };

  assertEquals(result.category, 'sessions');
  assertEquals(result.table_name, 'user_sessions');
});

// ============================================================================
// EXECUTION RESULT TESTS
// ============================================================================

Deno.test("CleanupExecutionResult - success structure", () => {
  const result: CleanupExecutionResult = {
    success: true,
    timestamp: new Date().toISOString(),
    action: 'run-all',
    total_rows_deleted: 500,
    duration_ms: 2500,
    results: [
      { category: 'oauth', table_name: 'oauth_states', rows_deleted: 100 },
      { category: 'sessions', table_name: 'sessions', rows_deleted: 400 }
    ],
    errors: []
  };

  assertEquals(result.success, true);
  assertEquals(result.errors.length, 0);
  assertEquals(result.total_rows_deleted, 500);
  assertEquals(result.results.length, 2);
});

Deno.test("CleanupExecutionResult - failure structure", () => {
  const result: CleanupExecutionResult = {
    success: false,
    timestamp: new Date().toISOString(),
    action: 'run-all',
    total_rows_deleted: 100,
    duration_ms: 1000,
    results: [
      { category: 'oauth', table_name: 'oauth_states', rows_deleted: 100 }
    ],
    errors: ['RPC error: Database connection lost']
  };

  assertEquals(result.success, false);
  assertEquals(result.errors.length > 0, true);
});

Deno.test("CleanupExecutionResult - duration tracking", () => {
  const startTime = Date.now();
  
  const result: CleanupExecutionResult = {
    success: true,
    timestamp: new Date().toISOString(),
    action: 'run-category',
    total_rows_deleted: 50,
    duration_ms: Date.now() - startTime,
    results: [],
    errors: []
  };

  assertEquals(typeof result.duration_ms, 'number');
  assertEquals(result.duration_ms >= 0, true);
});

// ============================================================================
// DRY RUN EXECUTION RESULT TESTS
// ============================================================================

Deno.test("DryRunExecutionResult - preview structure", () => {
  const result: DryRunExecutionResult = {
    success: true,
    timestamp: new Date().toISOString(),
    action: 'dry-run',
    total_rows_pending: 1500,
    results: [
      { category: 'oauth', table_name: 'oauth_states', rows_to_delete: 200 },
      { category: 'sessions', table_name: 'sessions', rows_to_delete: 1300 }
    ]
  };

  assertEquals(result.action, 'dry-run');
  assertEquals(result.total_rows_pending, 1500);
  assertEquals(result.results.length, 2);
});

Deno.test("DryRunExecutionResult - empty results valid", () => {
  const result: DryRunExecutionResult = {
    success: true,
    timestamp: new Date().toISOString(),
    action: 'dry-run',
    total_rows_pending: 0,
    results: []
  };

  assertEquals(result.total_rows_pending, 0);
  assertEquals(result.results.length, 0);
});
