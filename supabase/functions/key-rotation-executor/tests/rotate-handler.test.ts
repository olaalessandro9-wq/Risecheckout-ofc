/**
 * Rotate Handler Tests for key-rotation-executor
 * 
 * @module key-rotation-executor/tests/rotate-handler.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  validateRotate, 
  validateActivate,
  getBatchSize, 
  hasVersion,
  aggregateResults,
  getResultMessage,
  DEFAULT_BATCH_SIZE
} from "./_shared.ts";
import type { RotateTableResult, ActivateResponse, RotateRequestBody, ActivateRequestBody } from "./_shared.ts";

// ============================================================================
// ROTATE HANDLER TESTS
// ============================================================================

Deno.test("Rotate validation - should require targetVersion", () => {
  assertEquals(validateRotate({ targetVersion: 2 }).valid, true);
  assertEquals(validateRotate({} as RotateRequestBody).valid, false);
});

Deno.test("Rotate validation - error message format", () => {
  const result = validateRotate({} as RotateRequestBody);
  assertEquals(result.valid, false);
  assertEquals(result.error, "targetVersion is required");
});

Deno.test("Rotate - should use default batch size", () => {
  assertEquals(getBatchSize(), DEFAULT_BATCH_SIZE);
  assertEquals(getBatchSize(50), 50);
  assertEquals(getBatchSize(200), 200);
});

Deno.test("Rotate - default batch size is 100", () => {
  assertEquals(DEFAULT_BATCH_SIZE, 100);
});

Deno.test("Rotate - should verify target version exists", () => {
  assertEquals(hasVersion(2, [1, 2, 3]), true);
  assertEquals(hasVersion(4, [1, 2, 3]), false);
});

// ============================================================================
// TABLE ROTATOR SERVICE TESTS
// ============================================================================

Deno.test("RotateTableResult - should track processed and failed", () => {
  const result: RotateTableResult = {
    processed: 150,
    failed: 3
  };

  assertEquals(result.processed, 150);
  assertEquals(result.failed, 3);
});

Deno.test("Table rotator - should aggregate results", () => {
  const results: RotateTableResult[] = [
    { processed: 100, failed: 1 },
    { processed: 200, failed: 2 },
    { processed: 50, failed: 0 }
  ];

  const total = aggregateResults(results);

  assertEquals(total.processed, 350);
  assertEquals(total.failed, 3);
});

Deno.test("Table rotator - empty results", () => {
  const total = aggregateResults([]);
  assertEquals(total.processed, 0);
  assertEquals(total.failed, 0);
});

Deno.test("Table rotator - should determine success message", () => {
  assertEquals(getResultMessage(0).includes("successfully"), true);
  assertEquals(getResultMessage(5).includes("errors"), true);
});

// ============================================================================
// ACTIVATE HANDLER TESTS
// ============================================================================

Deno.test("Activate validation - should require version", () => {
  assertEquals(validateActivate({ version: 2 }).valid, true);
  assertEquals(validateActivate({} as ActivateRequestBody).valid, false);
});

Deno.test("Activate validation - error message format", () => {
  const result = validateActivate({} as ActivateRequestBody);
  assertEquals(result.valid, false);
  assertEquals(result.error, "version is required");
});

Deno.test("Activate response - success structure", () => {
  const response: ActivateResponse = {
    success: true,
    activatedVersion: 2
  };

  assertEquals(response.success, true);
  assertEquals(response.activatedVersion, 2);
});
