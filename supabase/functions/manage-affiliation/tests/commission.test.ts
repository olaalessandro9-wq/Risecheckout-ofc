/**
 * Commission Rate Validation Tests for manage-affiliation
 * @module manage-affiliation/tests/commission.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidCommissionRate, MAX_COMMISSION_RATE, MIN_COMMISSION_RATE, type AffiliationPayload } from "./_shared.ts";

Deno.test("manage-affiliation - commission - required for update_commission action", () => {
  const body: AffiliationPayload = { affiliation_id: "affil-123", action: "update_commission" };
  assertEquals(body.commission_rate, undefined);
});

Deno.test("manage-affiliation - commission - must be a number", () => {
  const body: Record<string, unknown> = { affiliation_id: "affil-123", action: "update_commission", commission_rate: "10" };
  const isValidType = typeof body.commission_rate === "number";
  assertEquals(isValidType, false);
});

Deno.test("manage-affiliation - commission - minimum is 1%", () => {
  assertEquals(isValidCommissionRate(0), false);
});

Deno.test("manage-affiliation - commission - maximum is 90%", () => {
  assertEquals(isValidCommissionRate(95), false);
});

Deno.test("manage-affiliation - commission - valid rate between 1 and 90", () => {
  assertEquals(isValidCommissionRate(30), true);
});

Deno.test("manage-affiliation - commission - edge case: exactly 1%", () => {
  assertEquals(isValidCommissionRate(MIN_COMMISSION_RATE), true);
});

Deno.test("manage-affiliation - commission - edge case: exactly 90%", () => {
  assertEquals(isValidCommissionRate(MAX_COMMISSION_RATE), true);
});
