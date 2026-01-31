/**
 * Input Validation Tests for producer-profile
 * 
 * @module producer-profile/tests/input-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateProfileRequest, type ProfileAction } from "./_shared.ts";

// ============================================================================
// INPUT VALIDATION TESTS
// ============================================================================

Deno.test("producer-profile - Validation - should require valid action", () => {
  const error = validateProfileRequest({ action: "invalid" as ProfileAction });
  assertExists(error);
  assertStringIncludes(error, "Ação desconhecida");
});

Deno.test("producer-profile - Validation - should accept get-profile", () => {
  const error = validateProfileRequest({ action: "get-profile" });
  assertEquals(error, null);
});

Deno.test("producer-profile - Validation - should accept check-credentials", () => {
  const error = validateProfileRequest({ action: "check-credentials" });
  assertEquals(error, null);
});

Deno.test("producer-profile - Validation - should require productId for get-gateway-connections", () => {
  const error = validateProfileRequest({ action: "get-gateway-connections" });
  assertExists(error);
  assertStringIncludes(error, "productId");
});

Deno.test("producer-profile - Validation - should accept get-gateway-connections with productId", () => {
  const error = validateProfileRequest({
    action: "get-gateway-connections",
    productId: "prod-001"
  });
  assertEquals(error, null);
});
