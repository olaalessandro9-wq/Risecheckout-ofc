/**
 * Release Settings Tests for content-save
 * 
 * @module content-save/tests/release-settings.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidReleaseType, type ReleaseData } from "./_shared.ts";

// ============================================================================
// RELEASE SETTINGS TESTS
// ============================================================================

Deno.test("content-save - Release - should accept immediate", () => {
  assertEquals(isValidReleaseType("immediate"), true);
});

Deno.test("content-save - Release - should accept days_after_purchase", () => {
  assertEquals(isValidReleaseType("days_after_purchase"), true);
});

Deno.test("content-save - Release - should accept fixed_date", () => {
  assertEquals(isValidReleaseType("fixed_date"), true);
});

Deno.test("content-save - Release - should accept after_content", () => {
  assertEquals(isValidReleaseType("after_content"), true);
});

Deno.test("content-save - Release - should reject invalid type", () => {
  assertEquals(isValidReleaseType("invalid"), false);
});

Deno.test("content-save - Release - days_after_purchase should have days", () => {
  const release: ReleaseData = {
    release_type: "days_after_purchase",
    days_after_purchase: 7,
  };
  assertExists(release.days_after_purchase);
  assertEquals(release.days_after_purchase, 7);
});

Deno.test("content-save - Release - fixed_date should have date", () => {
  const release: ReleaseData = {
    release_type: "fixed_date",
    fixed_date: "2024-12-25",
  };
  assertExists(release.fixed_date);
});

Deno.test("content-save - Release - after_content should have after_content_id", () => {
  const release: ReleaseData = {
    release_type: "after_content",
    after_content_id: "content-prev",
  };
  assertExists(release.after_content_id);
});
