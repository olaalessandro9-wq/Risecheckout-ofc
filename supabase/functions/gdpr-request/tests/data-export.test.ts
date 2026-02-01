/**
 * Data Export Tests for gdpr-request
 * 
 * @module gdpr-request/tests/data-export.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  DATA_CATEGORIES,
  SUPPORTED_FORMATS,
  GDPR_REQUEST_RULES,
  isDataCategory,
  isSupportedFormat,
} from "./_shared.ts";

// ============================================================================
// SELF REQUEST TESTS
// ============================================================================

Deno.test("gdpr-request: should allow user to request own data", () => {
  assertEquals(GDPR_REQUEST_RULES.selfRequestAllowed, true);
});

// ============================================================================
// DATA CATEGORIES TESTS
// ============================================================================

Deno.test("gdpr-request: should export all user data categories", () => {
  assert(DATA_CATEGORIES.length > 0);
  assert(isDataCategory("profile"));
  assert(isDataCategory("orders"));
  assert(isDataCategory("payments"));
  assert(isDataCategory("sessions"));
  assert(isDataCategory("security_logs"));
  assert(isDataCategory("preferences"));
});

Deno.test("gdpr-request: should have expected data categories count", () => {
  assertEquals(DATA_CATEGORIES.length, 6);
});

// ============================================================================
// EXPORT FORMATS TESTS
// ============================================================================

Deno.test("gdpr-request: should support JSON export format", () => {
  assert(isSupportedFormat("json"));
});

Deno.test("gdpr-request: should support CSV export format", () => {
  assert(isSupportedFormat("csv"));
});

Deno.test("gdpr-request: should have expected formats count", () => {
  assertEquals(SUPPORTED_FORMATS.length, 2);
});
