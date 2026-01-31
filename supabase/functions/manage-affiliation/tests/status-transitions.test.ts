/**
 * Status Transitions & Affiliate Code Tests for manage-affiliation
 * @module manage-affiliation/tests/status-transitions.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getStatusForAction, needsAffiliateCode } from "./_shared.ts";

// ============================================
// STATUS TRANSITIONS
// ============================================

Deno.test("manage-affiliation - status - approve sets status to active", () => {
  assertEquals(getStatusForAction("approve"), "active");
});

Deno.test("manage-affiliation - status - reject sets status to rejected", () => {
  assertEquals(getStatusForAction("reject"), "rejected");
});

Deno.test("manage-affiliation - status - block sets status to blocked", () => {
  assertEquals(getStatusForAction("block"), "blocked");
});

Deno.test("manage-affiliation - status - unblock sets status to active", () => {
  assertEquals(getStatusForAction("unblock"), "active");
});

Deno.test("manage-affiliation - status - update_commission preserves current status", () => {
  assertEquals(getStatusForAction("update_commission", "active"), "active");
});

// ============================================
// AFFILIATE CODE GENERATION
// ============================================

Deno.test("manage-affiliation - affiliate code - generated on approve if missing", () => {
  assertEquals(needsAffiliateCode("approve", null), true);
});

Deno.test("manage-affiliation - affiliate code - preserved if already exists on approve", () => {
  assertEquals(needsAffiliateCode("approve", "ABC123XY"), false);
});

Deno.test("manage-affiliation - affiliate code - generated on unblock if missing", () => {
  assertEquals(needsAffiliateCode("unblock", null), true);
});
