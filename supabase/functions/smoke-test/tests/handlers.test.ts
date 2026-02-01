/**
 * Smoke-Test Edge Function - Handlers Tests
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * @module smoke-test/tests/handlers
 */

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type SmokeTestResponse,
  type TestResult,
  isPassedTest,
  calculatePassRate,
  filterFailedTests,
  filterPassedTests,
  isAllTestsPassed,
} from "./_shared.ts";

// ============================================================================
// TEST RESULT HELPERS TESTS
// ============================================================================

Deno.test("smoke-test - Handlers - isPassedTest returns true for passed", () => {
  const test: TestResult = { name: "Test", passed: true };
  assertEquals(isPassedTest(test), true);
});

Deno.test("smoke-test - Handlers - isPassedTest returns false for failed", () => {
  const test: TestResult = { name: "Test", passed: false };
  assertEquals(isPassedTest(test), false);
});

// ============================================================================
// PASS RATE CALCULATION TESTS
// ============================================================================

Deno.test("smoke-test - Handlers - calculatePassRate returns 100 for all passed", () => {
  assertEquals(calculatePassRate(5, 5), 100);
});

Deno.test("smoke-test - Handlers - calculatePassRate returns 0 for none passed", () => {
  assertEquals(calculatePassRate(0, 5), 0);
});

Deno.test("smoke-test - Handlers - calculatePassRate returns 50 for half passed", () => {
  assertEquals(calculatePassRate(5, 10), 50);
});

Deno.test("smoke-test - Handlers - calculatePassRate handles zero total", () => {
  assertEquals(calculatePassRate(0, 0), 0);
});

// ============================================================================
// FILTER TESTS
// ============================================================================

Deno.test("smoke-test - Handlers - filterFailedTests returns only failed", () => {
  const tests: TestResult[] = [
    { name: "Test 1", passed: true },
    { name: "Test 2", passed: false },
    { name: "Test 3", passed: true },
    { name: "Test 4", passed: false },
  ];
  const failed = filterFailedTests(tests);
  assertEquals(failed.length, 2);
  assert(failed.every(t => t.passed === false));
});

Deno.test("smoke-test - Handlers - filterFailedTests returns empty when all pass", () => {
  const tests: TestResult[] = [
    { name: "Test 1", passed: true },
    { name: "Test 2", passed: true },
  ];
  assertEquals(filterFailedTests(tests).length, 0);
});

Deno.test("smoke-test - Handlers - filterPassedTests returns only passed", () => {
  const tests: TestResult[] = [
    { name: "Test 1", passed: true },
    { name: "Test 2", passed: false },
    { name: "Test 3", passed: true },
  ];
  const passed = filterPassedTests(tests);
  assertEquals(passed.length, 2);
  assert(passed.every(t => t.passed === true));
});

// ============================================================================
// SUCCESS DETERMINATION TESTS
// ============================================================================

Deno.test("smoke-test - Handlers - isAllTestsPassed true when success and no failures", () => {
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
  assertEquals(isAllTestsPassed(response), true);
});

Deno.test("smoke-test - Handlers - isAllTestsPassed false when failures exist", () => {
  const response: SmokeTestResponse = {
    success: false,
    version: "1.0",
    timestamp: new Date().toISOString(),
    total_tests: 5,
    passed: 4,
    failed: 1,
    duration_ms: 100,
    tests: [],
  };
  assertEquals(isAllTestsPassed(response), false);
});

Deno.test("smoke-test - Handlers - isAllTestsPassed false when success is false", () => {
  const response: SmokeTestResponse = {
    success: false,
    version: "1.0",
    timestamp: new Date().toISOString(),
    total_tests: 5,
    passed: 5,
    failed: 0,
    duration_ms: 100,
    tests: [],
  };
  assertEquals(isAllTestsPassed(response), false);
});
