/**
 * Settings Upsert Tests for members-area-drip
 * 
 * @module members-area-drip/tests/settings-upsert.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { prepareDripUpsert } from "./_shared.ts";

// ============================================================================
// SETTINGS UPSERT TESTS
// ============================================================================

Deno.test("members-area-drip - Upsert - days_after_purchase", () => {
  const result = prepareDripUpsert("c1", {
    release_type: "days_after_purchase",
    days_after_purchase: 7,
  });
  
  assertEquals(result.release_type, "days_after_purchase");
  assertEquals(result.days_after_purchase, 7);
  assertEquals(result.fixed_date, null);
  assertEquals(result.after_content_id, null);
});

Deno.test("members-area-drip - Upsert - fixed_date", () => {
  const result = prepareDripUpsert("c1", {
    release_type: "fixed_date",
    fixed_date: "2024-06-01",
  });
  
  assertEquals(result.release_type, "fixed_date");
  assertEquals(result.days_after_purchase, null);
  assertEquals(result.fixed_date, "2024-06-01");
  assertEquals(result.after_content_id, null);
});

Deno.test("members-area-drip - Upsert - after_content", () => {
  const result = prepareDripUpsert("c1", {
    release_type: "after_content",
    after_content_id: "c0",
  });
  
  assertEquals(result.release_type, "after_content");
  assertEquals(result.days_after_purchase, null);
  assertEquals(result.fixed_date, null);
  assertEquals(result.after_content_id, "c0");
});

Deno.test("members-area-drip - Upsert - clears unrelated fields", () => {
  const result = prepareDripUpsert("c1", {
    release_type: "immediate",
    days_after_purchase: 5,
    fixed_date: "2024-01-01",
    after_content_id: "c0",
  });
  
  assertEquals(result.release_type, "immediate");
  assertEquals(result.days_after_purchase, null);
  assertEquals(result.fixed_date, null);
  assertEquals(result.after_content_id, null);
});
