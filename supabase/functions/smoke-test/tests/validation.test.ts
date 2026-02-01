/**
 * Smoke-Test Edge Function - Validation Tests
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * @module smoke-test/tests/validation
 */

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type SmokeTestResponse,
  type TestResult,
  REQUIRED_RESPONSE_FIELDS,
  REQUIRED_TEST_FIELDS,
  isValidSmokeTestResponse,
  isValidTestResult,
  isConsistentCounts,
} from "./_shared.ts";

// ============================================================================
// RESPONSE STRUCTURE TESTS
// ============================================================================

Deno.test("smoke-test - Validation - has all required response fields", () => {
  assertEquals(REQUIRED_RESPONSE_FIELDS.length, 8);
  assert(REQUIRED_RESPONSE_FIELDS.includes("success"));
  assert(REQUIRED_RESPONSE_FIELDS.includes("version"));
  assert(REQUIRED_RESPONSE_FIELDS.includes("timestamp"));
  assert(REQUIRED_RESPONSE_FIELDS.includes("total_tests"));
  assert(REQUIRED_RESPONSE_FIELDS.includes("passed"));
  assert(REQUIRED_RESPONSE_FIELDS.includes("failed"));
  assert(REQUIRED_RESPONSE_FIELDS.includes("duration_ms"));
  assert(REQUIRED_RESPONSE_FIELDS.includes("tests"));
});

Deno.test("smoke-test - Validation - valid response passes validation", () => {
  const response: SmokeTestResponse = {
    success: true,
    version: "1.1",
    timestamp: new Date().toISOString(),
    total_tests: 5,
    passed: 5,
    failed: 0,
    duration_ms: 100,
    tests: [],
  };
  assertEquals(isValidSmokeTestResponse(response), true);
});

Deno.test("smoke-test - Validation - null is not valid response", () => {
  assertEquals(isValidSmokeTestResponse(null), false);
});

Deno.test("smoke-test - Validation - empty object is not valid response", () => {
  assertEquals(isValidSmokeTestResponse({}), false);
});

// ============================================================================
// TEST RESULT STRUCTURE TESTS
// ============================================================================

Deno.test("smoke-test - Validation - has required test result fields", () => {
  assertEquals(REQUIRED_TEST_FIELDS.length, 2);
  assert(REQUIRED_TEST_FIELDS.includes("name"));
  assert(REQUIRED_TEST_FIELDS.includes("passed"));
});

Deno.test("smoke-test - Validation - valid test result passes validation", () => {
  const testResult: TestResult = {
    name: "Database Connection",
    passed: true,
    message: "Connected successfully",
    duration_ms: 50,
  };
  assertEquals(isValidTestResult(testResult), true);
});

Deno.test("smoke-test - Validation - minimal test result is valid", () => {
  const testResult: TestResult = {
    name: "Test",
    passed: false,
  };
  assertEquals(isValidTestResult(testResult), true);
});

Deno.test("smoke-test - Validation - null is not valid test result", () => {
  assertEquals(isValidTestResult(null), false);
});

// ============================================================================
// COUNT CONSISTENCY TESTS
// ============================================================================

Deno.test("smoke-test - Validation - consistent counts when all pass", () => {
  const response: SmokeTestResponse = {
    success: true,
    version: "1.0",
    timestamp: new Date().toISOString(),
    total_tests: 5,
    passed: 5,
    failed: 0,
    duration_ms: 100,
    tests: [],
  };
  assertEquals(isConsistentCounts(response), true);
});

Deno.test("smoke-test - Validation - consistent counts when some fail", () => {
  const response: SmokeTestResponse = {
    success: false,
    version: "1.0",
    timestamp: new Date().toISOString(),
    total_tests: 5,
    passed: 3,
    failed: 2,
    duration_ms: 100,
    tests: [],
  };
  assertEquals(isConsistentCounts(response), true);
});

Deno.test("smoke-test - Validation - inconsistent counts detected", () => {
  const response: SmokeTestResponse = {
    success: false,
    version: "1.0",
    timestamp: new Date().toISOString(),
    total_tests: 5,
    passed: 3,
    failed: 1, // Should be 2
    duration_ms: 100,
    tests: [],
  };
  assertEquals(isConsistentCounts(response), false);
});
