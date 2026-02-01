/**
 * Smoke-Test Edge Function - Shared Test Utilities
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * @module smoke-test/tests/_shared
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  duration_ms?: number;
}

export interface SmokeTestResponse {
  success: boolean;
  version: string;
  timestamp: string;
  total_tests: number;
  passed: number;
  failed: number;
  duration_ms: number;
  tests: TestResult[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CRITICAL_SECRETS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export const TESTED_TABLES = [
  "users",
  "products",
  "orders",
  "checkouts",
] as const;

export const REQUIRED_RESPONSE_FIELDS = [
  "success",
  "version",
  "timestamp",
  "total_tests",
  "passed",
  "failed",
  "duration_ms",
  "tests",
] as const;

export const REQUIRED_TEST_FIELDS = [
  "name",
  "passed",
] as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Checks if a test result indicates success
 */
export function isPassedTest(test: TestResult): boolean {
  return test.passed === true;
}

/**
 * Calculates pass rate as percentage
 */
export function calculatePassRate(passed: number, total: number): number {
  if (total === 0) return 0;
  return (passed / total) * 100;
}

/**
 * Filters failed tests from array
 */
export function filterFailedTests(tests: TestResult[]): TestResult[] {
  return tests.filter(test => !test.passed);
}

/**
 * Filters passed tests from array
 */
export function filterPassedTests(tests: TestResult[]): TestResult[] {
  return tests.filter(test => test.passed);
}

/**
 * Validates SmokeTestResponse structure
 */
export function isValidSmokeTestResponse(response: unknown): response is SmokeTestResponse {
  if (typeof response !== "object" || response === null) return false;
  
  const r = response as Record<string, unknown>;
  
  return (
    typeof r.success === "boolean" &&
    typeof r.version === "string" &&
    typeof r.timestamp === "string" &&
    typeof r.total_tests === "number" &&
    typeof r.passed === "number" &&
    typeof r.failed === "number" &&
    typeof r.duration_ms === "number" &&
    Array.isArray(r.tests)
  );
}

/**
 * Validates TestResult structure
 */
export function isValidTestResult(result: unknown): result is TestResult {
  if (typeof result !== "object" || result === null) return false;
  
  const r = result as Record<string, unknown>;
  
  return (
    typeof r.name === "string" &&
    typeof r.passed === "boolean"
  );
}

/**
 * Checks if response indicates all tests passed
 */
export function isAllTestsPassed(response: SmokeTestResponse): boolean {
  return response.success === true && response.failed === 0;
}

/**
 * Validates passed + failed = total_tests
 */
export function isConsistentCounts(response: SmokeTestResponse): boolean {
  return response.passed + response.failed === response.total_tests;
}
