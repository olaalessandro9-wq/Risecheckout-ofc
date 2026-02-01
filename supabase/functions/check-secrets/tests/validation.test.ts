/**
 * Check-Secrets Edge Function - Validation Tests
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * @module check-secrets/tests/validation
 */

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  TOTAL_EXPECTED_SECRETS,
  EXPECTED_CATEGORIES,
  isValidPercentage,
  calculateMissing,
  calculatePercentage,
  isValidSecretsReport,
} from "./_shared.ts";

// ============================================================================
// REPORT STRUCTURE TESTS
// ============================================================================

Deno.test("check-secrets - Validation - report has required fields", () => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: { total: 22, configured: 10, missing: 12, percentage: "45.5%" },
    secrets: {},
    categories: {},
  };
  assertEquals(isValidSecretsReport(report), true);
});

Deno.test("check-secrets - Validation - null is not valid report", () => {
  assertEquals(isValidSecretsReport(null), false);
});

Deno.test("check-secrets - Validation - empty object is not valid report", () => {
  assertEquals(isValidSecretsReport({}), false);
});

// ============================================================================
// PERCENTAGE VALIDATION TESTS
// ============================================================================

Deno.test("check-secrets - Validation - valid percentage format", () => {
  assertEquals(isValidPercentage("85.5%"), true);
});

Deno.test("check-secrets - Validation - integer percentage is valid", () => {
  assertEquals(isValidPercentage("100%"), true);
});

Deno.test("check-secrets - Validation - zero percentage is valid", () => {
  assertEquals(isValidPercentage("0%"), true);
});

Deno.test("check-secrets - Validation - missing % suffix fails", () => {
  assertEquals(isValidPercentage("85.5"), false);
});

Deno.test("check-secrets - Validation - non-numeric percentage fails", () => {
  assertEquals(isValidPercentage("abc%"), false);
});

// ============================================================================
// CALCULATION TESTS
// ============================================================================

Deno.test("check-secrets - Validation - calculateMissing returns correct value", () => {
  assertEquals(calculateMissing(22, 10), 12);
});

Deno.test("check-secrets - Validation - calculateMissing with all configured", () => {
  assertEquals(calculateMissing(22, 22), 0);
});

Deno.test("check-secrets - Validation - calculateMissing with none configured", () => {
  assertEquals(calculateMissing(22, 0), 22);
});

Deno.test("check-secrets - Validation - calculatePercentage returns correct format", () => {
  assertEquals(calculatePercentage(10, 20), "50.0%");
});

Deno.test("check-secrets - Validation - calculatePercentage handles 100%", () => {
  assertEquals(calculatePercentage(22, 22), "100.0%");
});

Deno.test("check-secrets - Validation - calculatePercentage handles 0%", () => {
  assertEquals(calculatePercentage(0, 22), "0.0%");
});

Deno.test("check-secrets - Validation - calculatePercentage handles zero total", () => {
  assertEquals(calculatePercentage(0, 0), "0.0%");
});

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

Deno.test("check-secrets - Validation - total expected secrets is 22", () => {
  assertEquals(TOTAL_EXPECTED_SECRETS, 22);
});

Deno.test("check-secrets - Validation - has 6 expected categories", () => {
  assertEquals(EXPECTED_CATEGORIES.length, 6);
});
