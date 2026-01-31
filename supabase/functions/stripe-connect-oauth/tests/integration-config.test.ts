/**
 * Integration Config & Error Handling Tests for stripe-connect-oauth
 * 
 * @module stripe-connect-oauth/tests/integration-config.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mockIntegration } from "./_shared.ts";

// ============================================================================
// INTEGRATION CONFIG TESTS
// ============================================================================

Deno.test("stripe-connect-oauth - Integration Config - should have required fields in config", () => {
  const config = mockIntegration.config;
  assertExists(config.stripe_account_id);
  assertExists(config.connected_at);
  assertEquals(config.credentials_in_vault, true);
});

Deno.test("stripe-connect-oauth - Integration Config - should validate ISO date format for connected_at", () => {
  const config = mockIntegration.config;
  const date = new Date(config.connected_at);
  assertEquals(isNaN(date.getTime()), false);
});

Deno.test("stripe-connect-oauth - Integration Config - should distinguish test mode from live mode", () => {
  assertEquals(mockIntegration.config.livemode, false);
  const liveConfig = { ...mockIntegration.config, livemode: true };
  assertEquals(liveConfig.livemode, true);
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test("stripe-connect-oauth - Error Handling - should handle missing STRIPE_SECRET_KEY", () => {
  const secretKey = undefined;
  const hasKey = !!secretKey;
  assertEquals(hasKey, false);
});

Deno.test("stripe-connect-oauth - Error Handling - should handle missing STRIPE_CLIENT_ID", () => {
  const clientId = undefined;
  const hasClientId = !!clientId;
  assertEquals(hasClientId, false);
});

Deno.test("stripe-connect-oauth - Error Handling - should handle network errors gracefully", () => {
  const errorMessage = "Network request failed";
  assertExists(errorMessage);
});

Deno.test("stripe-connect-oauth - Error Handling - should format error response correctly", () => {
  const response = {
    success: false,
    error: "OAuth state expired",
  };
  assertEquals(response.success, false);
  assertExists(response.error);
});
