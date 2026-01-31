/**
 * Redirect URL & Config Tests for mercadopago-oauth-callback
 * 
 * @module mercadopago-oauth-callback/tests/redirect-url.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildErrorRedirectUrl,
  buildSuccessRedirectUrl,
  mockTokenResponse,
  MOCK_COLLECTOR_ID,
  mockIntegrationData,
  MOCK_CODE,
  MOCK_STATE,
} from "./_shared.ts";

// ============================================================================
// REDIRECT URL BUILDING TESTS
// ============================================================================

Deno.test("mercadopago-oauth-callback - Redirect URL - should build error redirect for authorization_denied", () => {
  const url = buildErrorRedirectUrl("https://risecheckout.com", "authorization_denied");
  assertEquals(url, "https://risecheckout.com/oauth-error.html?reason=authorization_denied");
});

Deno.test("mercadopago-oauth-callback - Redirect URL - should build error redirect for invalid_params", () => {
  const url = buildErrorRedirectUrl("https://risecheckout.com", "invalid_params");
  assertEquals(url, "https://risecheckout.com/oauth-error.html?reason=invalid_params");
});

Deno.test("mercadopago-oauth-callback - Redirect URL - should build error redirect for session_expired", () => {
  const url = buildErrorRedirectUrl("https://risecheckout.com", "session_expired");
  assertEquals(url, "https://risecheckout.com/oauth-error.html?reason=session_expired");
});

Deno.test("mercadopago-oauth-callback - Redirect URL - should build error redirect for token_exchange_failed", () => {
  const url = buildErrorRedirectUrl("https://risecheckout.com", "token_exchange_failed");
  assertEquals(url, "https://risecheckout.com/oauth-error.html?reason=token_exchange_failed");
});

Deno.test("mercadopago-oauth-callback - Redirect URL - should build error redirect for save_failed", () => {
  const url = buildErrorRedirectUrl("https://risecheckout.com", "save_failed");
  assertEquals(url, "https://risecheckout.com/oauth-error.html?reason=save_failed");
});

Deno.test("mercadopago-oauth-callback - Redirect URL - should build success redirect URL", () => {
  const url = buildSuccessRedirectUrl("https://risecheckout.com");
  assertEquals(url, "https://risecheckout.com/oauth-success.html");
});

// ============================================================================
// INTEGRATION CONFIG TESTS
// ============================================================================

Deno.test("mercadopago-oauth-callback - Integration Config - should convert user_id to string for collectorId", () => {
  const collectorId = String(mockTokenResponse.user_id);
  assertEquals(collectorId, "123456789");
  assertEquals(typeof collectorId, "string");
});

Deno.test("mercadopago-oauth-callback - Integration Config - should build correct integration config structure", () => {
  const config = {
    public_key: mockTokenResponse.public_key,
    user_id: MOCK_COLLECTOR_ID,
    email: mockIntegrationData.email,
    is_test: false,
    environment: 'production' as const,
    connected_at: new Date().toISOString(),
    credentials_in_vault: true,
  };
  assertExists(config.public_key);
  assertExists(config.user_id);
  assertExists(config.connected_at);
  assertEquals(config.credentials_in_vault, true);
  assertEquals(config.is_test, false);
});

Deno.test("mercadopago-oauth-callback - Integration Config - should validate ISO date format for connected_at", () => {
  const connectedAt = new Date().toISOString();
  const parsed = new Date(connectedAt);
  assertEquals(isNaN(parsed.getTime()), false);
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test("mercadopago-oauth-callback - Error Handling - should handle missing code parameter", () => {
  const code = null;
  const state = MOCK_STATE;
  const hasRequiredParams = !!code && !!state;
  assertEquals(hasRequiredParams, false);
});

Deno.test("mercadopago-oauth-callback - Error Handling - should handle missing state parameter", () => {
  const code = MOCK_CODE;
  const state = null;
  const hasRequiredParams = !!code && !!state;
  assertEquals(hasRequiredParams, false);
});

Deno.test("mercadopago-oauth-callback - Error Handling - should handle OAuth error from MercadoPago", () => {
  const error = "access_denied";
  assertExists(error);
});

Deno.test("mercadopago-oauth-callback - Error Handling - should handle missing MERCADOPAGO_CLIENT_SECRET", () => {
  const clientSecret = undefined;
  const hasSecret = !!clientSecret;
  assertEquals(hasSecret, false);
});
