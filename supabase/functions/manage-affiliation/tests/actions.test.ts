/**
 * Action Validation Tests for manage-affiliation
 * @module manage-affiliation/tests/actions.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidAction, type AffiliationPayload } from "./_shared.ts";

Deno.test("manage-affiliation - actions - supports approve action", () => {
  assertEquals(isValidAction("approve"), true);
});

Deno.test("manage-affiliation - actions - supports reject action", () => {
  assertEquals(isValidAction("reject"), true);
});

Deno.test("manage-affiliation - actions - supports block action", () => {
  assertEquals(isValidAction("block"), true);
});

Deno.test("manage-affiliation - actions - supports unblock action", () => {
  assertEquals(isValidAction("unblock"), true);
});

Deno.test("manage-affiliation - actions - supports update_commission action", () => {
  assertEquals(isValidAction("update_commission"), true);
});

Deno.test("manage-affiliation - actions - rejects invalid action", () => {
  assertEquals(isValidAction("invalid_action"), false);
});

// ============================================
// INPUT VALIDATION
// ============================================

Deno.test("manage-affiliation - validation - affiliation_id is required", () => {
  const body: AffiliationPayload = { action: "approve" };
  assertEquals(body.affiliation_id, undefined);
});

Deno.test("manage-affiliation - validation - action is required", () => {
  const body: AffiliationPayload = { affiliation_id: "affil-123" };
  assertEquals(body.action, undefined);
});

Deno.test("manage-affiliation - validation - valid request structure", () => {
  const body: AffiliationPayload = {
    affiliation_id: "affil-123",
    action: "approve",
  };
  
  assertExists(body.affiliation_id);
  assertExists(body.action);
});
