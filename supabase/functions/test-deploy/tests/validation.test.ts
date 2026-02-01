/**
 * Test-Deploy Edge Function - Validation Tests
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * @module test-deploy/tests/validation
 */

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  VALID_STATUSES,
  REQUIRED_FIELDS,
  isValidUUID,
  isValidTimestamp,
  isSuccessStatus,
  isValidDeployResponse,
} from "./_shared.ts";

// ============================================================================
// STATUS VALIDATION TESTS
// ============================================================================

Deno.test("test-deploy - Validation - valid statuses are ok and error", () => {
  assertEquals(VALID_STATUSES.length, 2);
  assert(VALID_STATUSES.includes("ok"));
  assert(VALID_STATUSES.includes("error"));
});

Deno.test("test-deploy - Validation - ok status is success", () => {
  assertEquals(isSuccessStatus("ok"), true);
});

Deno.test("test-deploy - Validation - error status is not success", () => {
  assertEquals(isSuccessStatus("error"), false);
});

// ============================================================================
// REQUIRED FIELDS TESTS
// ============================================================================

Deno.test("test-deploy - Validation - has 5 required fields", () => {
  assertEquals(REQUIRED_FIELDS.length, 5);
});

Deno.test("test-deploy - Validation - status is required", () => {
  assert(REQUIRED_FIELDS.includes("status"));
});

Deno.test("test-deploy - Validation - message is required", () => {
  assert(REQUIRED_FIELDS.includes("message"));
});

Deno.test("test-deploy - Validation - created_at is required", () => {
  assert(REQUIRED_FIELDS.includes("created_at"));
});

Deno.test("test-deploy - Validation - test_id is required", () => {
  assert(REQUIRED_FIELDS.includes("test_id"));
});

Deno.test("test-deploy - Validation - environment is required", () => {
  assert(REQUIRED_FIELDS.includes("environment"));
});

// ============================================================================
// UUID VALIDATION TESTS
// ============================================================================

Deno.test("test-deploy - Validation - valid UUID v4 passes", () => {
  assertEquals(isValidUUID("550e8400-e29b-41d4-a716-446655440000"), true);
});

Deno.test("test-deploy - Validation - crypto.randomUUID format passes", () => {
  const uuid = crypto.randomUUID();
  assertEquals(isValidUUID(uuid), true);
});

Deno.test("test-deploy - Validation - invalid UUID fails", () => {
  assertEquals(isValidUUID("not-a-uuid"), false);
});

Deno.test("test-deploy - Validation - empty string UUID fails", () => {
  assertEquals(isValidUUID(""), false);
});

Deno.test("test-deploy - Validation - null UUID fails", () => {
  assertEquals(isValidUUID(null), false);
});

// ============================================================================
// TIMESTAMP VALIDATION TESTS
// ============================================================================

Deno.test("test-deploy - Validation - valid ISO timestamp passes", () => {
  assertEquals(isValidTimestamp("2024-01-15T10:30:00.000Z"), true);
});

Deno.test("test-deploy - Validation - Date.toISOString() passes", () => {
  assertEquals(isValidTimestamp(new Date().toISOString()), true);
});

Deno.test("test-deploy - Validation - invalid timestamp fails", () => {
  assertEquals(isValidTimestamp("not-a-date"), false);
});

// ============================================================================
// RESPONSE STRUCTURE TESTS
// ============================================================================

Deno.test("test-deploy - Validation - valid response passes", () => {
  const response = {
    status: "ok",
    message: "Test deploy successful!",
    created_at: new Date().toISOString(),
    test_id: crypto.randomUUID(),
    environment: {
      deno_version: "1.40.0",
      typescript_version: "5.3.3",
    },
  };
  assertEquals(isValidDeployResponse(response), true);
});

Deno.test("test-deploy - Validation - null is not valid response", () => {
  assertEquals(isValidDeployResponse(null), false);
});

Deno.test("test-deploy - Validation - empty object is not valid response", () => {
  assertEquals(isValidDeployResponse({}), false);
});
