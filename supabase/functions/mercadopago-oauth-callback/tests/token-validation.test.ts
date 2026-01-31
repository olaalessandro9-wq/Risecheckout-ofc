/**
 * Token & Integration Validation Tests for mercadopago-oauth-callback
 * 
 * @module mercadopago-oauth-callback/tests/token-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validateTokenResponse,
  validateIntegrationData,
  mapTokenErrorToReason,
  mockTokenResponse,
  mockIntegrationData,
} from "./_shared.ts";

// ============================================================================
// TOKEN VALIDATION TESTS
// ============================================================================

Deno.test("mercadopago-oauth-callback - Token Validation - should accept valid token response", () => {
  const result = validateTokenResponse(mockTokenResponse);
  assertEquals(result.valid, true);
});

Deno.test("mercadopago-oauth-callback - Token Validation - should reject null response", () => {
  const result = validateTokenResponse(null);
  assertEquals(result.valid, false);
  assertEquals(result.reason, "empty_response");
});

Deno.test("mercadopago-oauth-callback - Token Validation - should reject response without access_token", () => {
  const invalid = { ...mockTokenResponse, access_token: "" };
  const result = validateTokenResponse(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.reason, "missing_token");
});

Deno.test("mercadopago-oauth-callback - Token Validation - should reject response with invalid user_id type", () => {
  const invalid = { ...mockTokenResponse, user_id: "not-a-number" as unknown as number };
  const result = validateTokenResponse(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.reason, "invalid_user_id");
});

Deno.test("mercadopago-oauth-callback - Token Validation - should reject response with zero user_id", () => {
  const invalid = { ...mockTokenResponse, user_id: 0 };
  const result = validateTokenResponse(invalid);
  assertEquals(result.valid, false);
});

Deno.test("mercadopago-oauth-callback - Token Validation - should accept response with valid numeric user_id", () => {
  const valid = { ...mockTokenResponse, user_id: 987654321 };
  const result = validateTokenResponse(valid);
  assertEquals(result.valid, true);
});

// ============================================================================
// INTEGRATION DATA VALIDATION TESTS
// ============================================================================

Deno.test("mercadopago-oauth-callback - Integration Data Validation - should accept valid integration data", () => {
  const result = validateIntegrationData(mockIntegrationData);
  assertEquals(result.valid, true);
});

Deno.test("mercadopago-oauth-callback - Integration Data Validation - should reject data without vendorId", () => {
  const invalid = { ...mockIntegrationData, vendorId: "" };
  const result = validateIntegrationData(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Missing vendorId");
});

Deno.test("mercadopago-oauth-callback - Integration Data Validation - should reject data without accessToken", () => {
  const invalid = { ...mockIntegrationData, accessToken: "" };
  const result = validateIntegrationData(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Missing accessToken");
});

Deno.test("mercadopago-oauth-callback - Integration Data Validation - should reject data without collectorId", () => {
  const invalid = { ...mockIntegrationData, collectorId: "" };
  const result = validateIntegrationData(invalid);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Missing collectorId");
});

Deno.test("mercadopago-oauth-callback - Integration Data Validation - should accept data with null email", () => {
  const withNullEmail = { ...mockIntegrationData, email: null };
  const result = validateIntegrationData(withNullEmail);
  assertEquals(result.valid, true);
});

// ============================================================================
// TOKEN ERROR MAPPING TESTS
// ============================================================================

Deno.test("mercadopago-oauth-callback - Token Error Mapping - should map invalid_grant error", () => {
  const reason = mapTokenErrorToReason("Error: invalid_grant - code expired");
  assertEquals(reason, "invalid_grant");
});

Deno.test("mercadopago-oauth-callback - Token Error Mapping - should map redirect_uri error", () => {
  const reason = mapTokenErrorToReason("redirect_uri does not match");
  assertEquals(reason, "redirect_uri_mismatch");
});

Deno.test("mercadopago-oauth-callback - Token Error Mapping - should use default for unknown errors", () => {
  const reason = mapTokenErrorToReason("Unknown error occurred");
  assertEquals(reason, "token_exchange_failed");
});
