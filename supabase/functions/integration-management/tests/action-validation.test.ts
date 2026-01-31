/**
 * Action & Type Validation Tests for integration-management
 * 
 * @module integration-management/tests/action-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { extractAction, isValidAction, isValidIntegrationType } from "./_shared.ts";

// ============================================================================
// ACTION EXTRACTION TESTS
// ============================================================================

Deno.test("integration-management - Action Extraction - should extract action from body", () => {
  const action = extractAction("/integration-management", "save-credentials");
  assertEquals(action, "save-credentials");
});

Deno.test("integration-management - Action Extraction - should extract action from URL path", () => {
  const action = extractAction("/integration-management/disconnect", null);
  assertEquals(action, "disconnect");
});

Deno.test("integration-management - Action Extraction - should prefer body action over URL", () => {
  const action = extractAction("/integration-management/status", "save-credentials");
  assertEquals(action, "save-credentials");
});

Deno.test("integration-management - Action Extraction - should return null for base path without action", () => {
  const action = extractAction("/integration-management", null);
  assertEquals(action, null);
});

// ============================================================================
// ACTION VALIDATION TESTS
// ============================================================================

Deno.test("integration-management - Action Validation - should accept valid actions", () => {
  const validActions = ["save-credentials", "disconnect", "init-oauth", "status", "save-profile-wallet", "clear-profile-wallet", "update-profile"];
  validActions.forEach(action => assertEquals(isValidAction(action), true));
});

Deno.test("integration-management - Action Validation - should reject invalid actions", () => {
  assertEquals(isValidAction("unknown-action"), false);
  assertEquals(isValidAction(""), false);
  assertEquals(isValidAction("delete-all"), false);
});

// ============================================================================
// INTEGRATION TYPE VALIDATION TESTS
// ============================================================================

Deno.test("integration-management - Integration Type Validation - should accept valid integration types", () => {
  assertEquals(isValidIntegrationType("MERCADOPAGO"), true);
  assertEquals(isValidIntegrationType("STRIPE"), true);
  assertEquals(isValidIntegrationType("ASAAS"), true);
  assertEquals(isValidIntegrationType("PUSHINPAY"), true);
});

Deno.test("integration-management - Integration Type Validation - should reject invalid integration types", () => {
  assertEquals(isValidIntegrationType("PAYPAL"), false);
  assertEquals(isValidIntegrationType("invalid"), false);
  assertEquals(isValidIntegrationType(null), false);
  assertEquals(isValidIntegrationType(undefined), false);
});
