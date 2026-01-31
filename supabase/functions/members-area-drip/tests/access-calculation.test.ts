/**
 * Access Calculation Tests for members-area-drip
 * 
 * @module members-area-drip/tests/access-calculation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  checkDaysAfterPurchase, 
  checkFixedDate, 
  checkAfterContent,
  checkContentAccess 
} from "./_shared.ts";

// ============================================================================
// DAYS AFTER PURCHASE TESTS
// ============================================================================

Deno.test("members-area-drip - Days After - grants access after period", () => {
  const purchaseDate = new Date("2024-01-01");
  const now = new Date("2024-01-15");
  const result = checkDaysAfterPurchase(purchaseDate, 7, now);
  assertEquals(result.has_access, true);
});

Deno.test("members-area-drip - Days After - denies access before period", () => {
  const purchaseDate = new Date("2024-01-01");
  const now = new Date("2024-01-05");
  const result = checkDaysAfterPurchase(purchaseDate, 7, now);
  assertEquals(result.has_access, false);
  assertEquals(result.reason, "not_yet_released");
  assertExists(result.release_date);
});

Deno.test("members-area-drip - Days After - exact day grants access", () => {
  const purchaseDate = new Date("2024-01-01T00:00:00Z");
  const now = new Date("2024-01-08T00:00:00Z");
  const result = checkDaysAfterPurchase(purchaseDate, 7, now);
  assertEquals(result.has_access, true);
});

Deno.test("members-area-drip - Days After - zero days means immediate", () => {
  const purchaseDate = new Date("2024-01-01");
  const now = new Date("2024-01-01");
  const result = checkDaysAfterPurchase(purchaseDate, 0, now);
  assertEquals(result.has_access, true);
});

// ============================================================================
// FIXED DATE TESTS
// ============================================================================

Deno.test("members-area-drip - Fixed Date - grants access after date", () => {
  const fixedDate = new Date("2024-06-01");
  const now = new Date("2024-07-01");
  const result = checkFixedDate(fixedDate, now);
  assertEquals(result.has_access, true);
});

Deno.test("members-area-drip - Fixed Date - denies access before date", () => {
  const fixedDate = new Date("2024-06-01");
  const now = new Date("2024-05-01");
  const result = checkFixedDate(fixedDate, now);
  assertEquals(result.has_access, false);
  assertEquals(result.reason, "not_yet_released");
});

Deno.test("members-area-drip - Fixed Date - grants access on exact date", () => {
  const fixedDate = new Date("2024-06-01T00:00:00Z");
  const now = new Date("2024-06-01T00:00:00Z");
  const result = checkFixedDate(fixedDate, now);
  assertEquals(result.has_access, true);
});

// ============================================================================
// AFTER CONTENT (PREREQUISITE) TESTS
// ============================================================================

Deno.test("members-area-drip - After Content - grants when prerequisite completed", () => {
  const result = checkAfterContent("2024-01-15T10:30:00Z");
  assertEquals(result.has_access, true);
});

Deno.test("members-area-drip - After Content - denies when not completed", () => {
  const result = checkAfterContent(null);
  assertEquals(result.has_access, false);
  assertEquals(result.reason, "prerequisite_not_completed");
});

// ============================================================================
// COMPREHENSIVE ACCESS CHECK TESTS
// ============================================================================

Deno.test("members-area-drip - Access - null settings means immediate access", () => {
  const result = checkContentAccess({
    settings: null,
    contentAccess: null,
    purchaseDate: null,
    prerequisiteCompleted: null,
    now: new Date(),
  });
  assertEquals(result.has_access, true);
});

Deno.test("members-area-drip - Access - explicit access overrides settings", () => {
  const result = checkContentAccess({
    settings: { release_type: "days_after_purchase", days_after_purchase: 30 },
    contentAccess: { is_active: true, expires_at: null },
    purchaseDate: "2024-01-01",
    prerequisiteCompleted: null,
    now: new Date("2024-01-02"),
  });
  assertEquals(result.has_access, true);
});

Deno.test("members-area-drip - Access - expired content access is ignored", () => {
  const result = checkContentAccess({
    settings: { release_type: "days_after_purchase", days_after_purchase: 30 },
    contentAccess: { is_active: true, expires_at: "2024-01-01T00:00:00Z" },
    purchaseDate: "2024-01-01",
    prerequisiteCompleted: null,
    now: new Date("2024-01-15"),
  });
  assertEquals(result.has_access, false);
});

Deno.test("members-area-drip - Access - no purchase date means no access", () => {
  const result = checkContentAccess({
    settings: { release_type: "days_after_purchase", days_after_purchase: 7 },
    contentAccess: null,
    purchaseDate: null,
    prerequisiteCompleted: null,
    now: new Date(),
  });
  assertEquals(result.has_access, false);
  assertEquals(result.reason, "no_product_access");
});
