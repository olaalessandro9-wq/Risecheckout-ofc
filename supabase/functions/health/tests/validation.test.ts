/**
 * Health Edge Function - Validation Tests
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * @module health/tests/validation
 */

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  VALID_STATUSES,
  REQUIRED_FIELDS,
  REQUIRED_OK_FIELDS,
  isValidTimestamp,
  isValidResponseTime,
  isHealthyStatus,
} from "./_shared.ts";

// ============================================================================
// STATUS VALIDATION TESTS
// ============================================================================

Deno.test("health - Validation - valid statuses are OK and ERROR", () => {
  assertEquals(VALID_STATUSES.length, 2);
  assert(VALID_STATUSES.includes("OK"));
  assert(VALID_STATUSES.includes("ERROR"));
});

Deno.test("health - Validation - OK status is healthy", () => {
  assertEquals(isHealthyStatus("OK"), true);
});

Deno.test("health - Validation - ERROR status is not healthy", () => {
  assertEquals(isHealthyStatus("ERROR"), false);
});

// ============================================================================
// REQUIRED FIELDS TESTS
// ============================================================================

Deno.test("health - Validation - required fields for all responses", () => {
  assertEquals(REQUIRED_FIELDS.length, 3);
  assert(REQUIRED_FIELDS.includes("status"));
  assert(REQUIRED_FIELDS.includes("timestamp"));
  assert(REQUIRED_FIELDS.includes("responseTime"));
});

Deno.test("health - Validation - required fields for OK response", () => {
  assertEquals(REQUIRED_OK_FIELDS.length, 4);
  assert(REQUIRED_OK_FIELDS.includes("services"));
});

// ============================================================================
// TIMESTAMP VALIDATION TESTS
// ============================================================================

Deno.test("health - Validation - valid ISO timestamp passes", () => {
  assertEquals(isValidTimestamp("2024-01-15T10:30:00.000Z"), true);
});

Deno.test("health - Validation - invalid timestamp fails", () => {
  assertEquals(isValidTimestamp("not-a-date"), false);
});

Deno.test("health - Validation - empty string timestamp fails", () => {
  assertEquals(isValidTimestamp(""), false);
});

Deno.test("health - Validation - null timestamp fails", () => {
  assertEquals(isValidTimestamp(null), false);
});

Deno.test("health - Validation - number timestamp fails", () => {
  assertEquals(isValidTimestamp(12345), false);
});

// ============================================================================
// RESPONSE TIME VALIDATION TESTS
// ============================================================================

Deno.test("health - Validation - valid responseTime format passes", () => {
  assertEquals(isValidResponseTime("123ms"), true);
});

Deno.test("health - Validation - zero ms is valid", () => {
  assertEquals(isValidResponseTime("0ms"), true);
});

Deno.test("health - Validation - large responseTime is valid", () => {
  assertEquals(isValidResponseTime("5000ms"), true);
});

Deno.test("health - Validation - missing ms suffix fails", () => {
  assertEquals(isValidResponseTime("123"), false);
});

Deno.test("health - Validation - wrong suffix fails", () => {
  assertEquals(isValidResponseTime("123s"), false);
});

Deno.test("health - Validation - non-numeric value fails", () => {
  assertEquals(isValidResponseTime("abcms"), false);
});
