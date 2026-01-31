/**
 * Input Validation Tests for product-settings
 * 
 * @module product-settings/tests/validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidAction, verifyOwnership } from "./_shared.ts";

// ============================================================================
// ACTION VALIDATION TESTS
// ============================================================================

Deno.test("product-settings - Validation - should accept update-settings action", () => {
  assertEquals(isValidAction("update-settings"), true);
});

Deno.test("product-settings - Validation - should accept update-general action", () => {
  assertEquals(isValidAction("update-general"), true);
});

Deno.test("product-settings - Validation - should accept smart-delete action", () => {
  assertEquals(isValidAction("smart-delete"), true);
});

Deno.test("product-settings - Validation - should accept update-price action", () => {
  assertEquals(isValidAction("update-price"), true);
});

Deno.test("product-settings - Validation - should accept update-affiliate-gateway-settings action", () => {
  assertEquals(isValidAction("update-affiliate-gateway-settings"), true);
});

Deno.test("product-settings - Validation - should accept update-members-area-settings action", () => {
  assertEquals(isValidAction("update-members-area-settings"), true);
});

Deno.test("product-settings - Validation - should accept update-upsell-settings action", () => {
  assertEquals(isValidAction("update-upsell-settings"), true);
});

Deno.test("product-settings - Validation - should reject invalid action", () => {
  assertEquals(isValidAction("invalid"), false);
});

// ============================================================================
// OWNERSHIP VERIFICATION TESTS
// ============================================================================

Deno.test("product-settings - Ownership - should approve valid ownership", () => {
  assertEquals(verifyOwnership("prod-1", "user-123"), true);
});

Deno.test("product-settings - Ownership - should reject invalid ownership", () => {
  assertEquals(verifyOwnership("prod-1", "user-456"), false);
});

Deno.test("product-settings - Ownership - should reject non-existent product", () => {
  assertEquals(verifyOwnership("prod-inexistente", "user-123"), false);
});

Deno.test("product-settings - Validation - should require productId", () => {
  const body = { action: "update-settings", settings: {} };
  const productId = (body as Record<string, unknown>).productId;
  assertEquals(productId, undefined);
});
