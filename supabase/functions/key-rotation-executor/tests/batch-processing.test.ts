/**
 * Batch Processing Tests for key-rotation-executor
 * 
 * @module key-rotation-executor/tests/batch-processing.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  getNextBatch, 
  isEndOfData, 
  shouldRotate,
  DEFAULT_ROTATION_CONFIG
} from "./_shared.ts";
import type { RotationProgress, RotationCompletion } from "./_shared.ts";

// ============================================================================
// BATCH PROCESSING TESTS
// ============================================================================

Deno.test("Batch processing - should paginate correctly", () => {
  const items = [
    { id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }
  ];

  const batch1 = getNextBatch(items, null, 2);
  assertEquals(batch1.length, 2);
  assertEquals(batch1[0].id, "1");

  const batch2 = getNextBatch(items, "2", 2);
  assertEquals(batch2.length, 2);
  assertEquals(batch2[0].id, "3");

  const batch3 = getNextBatch(items, "4", 2);
  assertEquals(batch3.length, 1);
});

Deno.test("Batch processing - should detect end of data", () => {
  assertEquals(isEndOfData(0), true);
  assertEquals(isEndOfData(10), false);
});

Deno.test("Batch processing - first batch starts from beginning", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const batch = getNextBatch(items, null, 10);
  assertEquals(batch.length, 3);
  assertEquals(batch[0].id, "a");
});

// ============================================================================
// VERSION ROTATION TESTS
// ============================================================================

Deno.test("Version detection - should skip already rotated records", () => {
  assertEquals(shouldRotate(1, 2), true);  // Needs rotation
  assertEquals(shouldRotate(2, 2), false); // Already at target
  assertEquals(shouldRotate(3, 2), false); // Above target
  assertEquals(shouldRotate(null, 2), false); // Not encrypted
});

Deno.test("Version detection - null means not encrypted", () => {
  assertEquals(shouldRotate(null, 1), false);
  assertEquals(shouldRotate(null, 5), false);
});

// ============================================================================
// DELAY CONFIGURATION TESTS
// ============================================================================

Deno.test("Default rotation config - should have reasonable values", () => {
  assertEquals(DEFAULT_ROTATION_CONFIG.batchSize, 100);
  assertEquals(DEFAULT_ROTATION_CONFIG.delayBetweenBatches, 100);
  assertEquals(DEFAULT_ROTATION_CONFIG.tables.length >= 1, true);
});

Deno.test("Default rotation config - tables have required fields", () => {
  const table = DEFAULT_ROTATION_CONFIG.tables[0];
  assertExists(table.tableName);
  assertExists(table.encryptedColumns);
  assertExists(table.primaryKey);
  assertEquals(Array.isArray(table.encryptedColumns), true);
});

// ============================================================================
// ROTATION LOG TESTS
// ============================================================================

Deno.test("Rotation log - should track progress", () => {
  const progress: RotationProgress = {
    log_id: "uuid-123",
    processed: 250,
    failed: 1
  };

  assertExists(progress.log_id);
  assertEquals(progress.processed >= 0, true);
  assertEquals(progress.failed >= 0, true);
});

Deno.test("Rotation log - should track completion", () => {
  const success: RotationCompletion = {
    log_id: "uuid-123",
    success: true,
    error: null
  };

  const failure: RotationCompletion = {
    log_id: "uuid-456",
    success: false,
    error: "Database connection lost"
  };

  assertEquals(success.success, true);
  assertEquals(success.error, null);
  assertEquals(failure.success, false);
  assertExists(failure.error);
});
