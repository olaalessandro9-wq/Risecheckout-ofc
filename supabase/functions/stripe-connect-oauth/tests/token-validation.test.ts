/**
 * Token Validation Tests for stripe-connect-oauth
 * 
 * @module stripe-connect-oauth/tests/token-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateTokenResponse, mockTokenResponse } from "./_shared.ts";

// ============================================================================
// TOKEN VALIDATION TESTS
// ============================================================================

Deno.test("stripe-connect-oauth - Token Validation - should accept valid token response", () => {
  const result = validateTokenResponse(mockTokenResponse);
  assertEquals(result.valid, true);
});

Deno.test("stripe-connect-oauth - Token Validation - should reject null response", () => {
  const result = validateTokenResponse(null);
  assertEquals(result.valid, false);
  assertEquals(result.error, "No token response");
});

Deno.test("stripe-connect-oauth - Token Validation - should reject response without stripe_user_id", () => {
  const invalid = { ...mockTokenResponse, stripe_user_id: "" };
  const result = validateTokenResponse(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Missing stripe_user_id");
});

Deno.test("stripe-connect-oauth - Token Validation - should reject response without access_token", () => {
  const invalid = { ...mockTokenResponse, access_token: "" };
  const result = validateTokenResponse(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Missing access_token");
});

Deno.test("stripe-connect-oauth - Token Validation - should accept response with null refresh_token", () => {
  const withNullRefresh = { ...mockTokenResponse, refresh_token: null };
  const result = validateTokenResponse(withNullRefresh);
  assertEquals(result.valid, true);
});
