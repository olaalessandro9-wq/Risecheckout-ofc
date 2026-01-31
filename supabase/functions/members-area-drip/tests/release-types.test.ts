/**
 * Release Types Tests for members-area-drip
 * 
 * @module members-area-drip/tests/release-types.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidReleaseType, shouldDeleteSettings } from "./_shared.ts";

// ============================================================================
// RELEASE TYPE VALIDATION TESTS
// ============================================================================

Deno.test("members-area-drip - Release Types - immediate is valid", () => {
  assertEquals(isValidReleaseType("immediate"), true);
});

Deno.test("members-area-drip - Release Types - days_after_purchase is valid", () => {
  assertEquals(isValidReleaseType("days_after_purchase"), true);
});

Deno.test("members-area-drip - Release Types - fixed_date is valid", () => {
  assertEquals(isValidReleaseType("fixed_date"), true);
});

Deno.test("members-area-drip - Release Types - after_content is valid", () => {
  assertEquals(isValidReleaseType("after_content"), true);
});

Deno.test("members-area-drip - Release Types - after_completion is NOT valid", () => {
  assertEquals(isValidReleaseType("after_completion"), false);
});

Deno.test("members-area-drip - Release Types - unknown type is invalid", () => {
  assertEquals(isValidReleaseType("unknown"), false);
});

// ============================================================================
// IMMEDIATE RELEASE SPECIAL HANDLING TESTS
// ============================================================================

Deno.test("members-area-drip - Immediate - should delete settings", () => {
  assertEquals(shouldDeleteSettings("immediate"), true);
});

Deno.test("members-area-drip - Immediate - days_after_purchase should not delete", () => {
  assertEquals(shouldDeleteSettings("days_after_purchase"), false);
});

Deno.test("members-area-drip - Immediate - fixed_date should not delete", () => {
  assertEquals(shouldDeleteSettings("fixed_date"), false);
});

Deno.test("members-area-drip - Immediate - after_content should not delete", () => {
  assertEquals(shouldDeleteSettings("after_content"), false);
});
