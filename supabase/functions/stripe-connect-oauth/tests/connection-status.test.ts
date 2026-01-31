/**
 * Connection Status Tests for stripe-connect-oauth
 * 
 * @module stripe-connect-oauth/tests/connection-status.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getConnectionStatus,
  isValidAction,
  mockIntegration,
  MOCK_STRIPE_ACCOUNT_ID,
  VendorIntegration,
} from "./_shared.ts";

// ============================================================================
// CONNECTION STATUS TESTS
// ============================================================================

Deno.test("stripe-connect-oauth - Connection Status - should return connected status for active integration", () => {
  const status = getConnectionStatus(mockIntegration);
  assertEquals(status.connected, true);
  assertEquals(status.account_id, MOCK_STRIPE_ACCOUNT_ID);
  assertEquals(status.email, "business@example.com");
  assertEquals(status.livemode, false);
});

Deno.test("stripe-connect-oauth - Connection Status - should return disconnected for null integration", () => {
  const status = getConnectionStatus(null);
  assertEquals(status.connected, false);
  assertEquals(status.account_id, null);
  assertEquals(status.email, null);
  assertEquals(status.livemode, null);
});

Deno.test("stripe-connect-oauth - Connection Status - should return disconnected for inactive integration", () => {
  const inactive: VendorIntegration = { ...mockIntegration, active: false };
  const status = getConnectionStatus(inactive);
  assertEquals(status.connected, false);
});

Deno.test("stripe-connect-oauth - Connection Status - should return disconnected for integration without account_id", () => {
  const noAccount: VendorIntegration = {
    ...mockIntegration,
    config: { ...mockIntegration.config, stripe_account_id: "" },
  };
  const status = getConnectionStatus(noAccount);
  assertEquals(status.connected, false);
});

Deno.test("stripe-connect-oauth - Connection Status - should handle livemode true correctly", () => {
  const liveIntegration: VendorIntegration = {
    ...mockIntegration,
    config: { ...mockIntegration.config, livemode: true },
  };
  const status = getConnectionStatus(liveIntegration);
  assertEquals(status.livemode, true);
});

// ============================================================================
// ACTION VALIDATION TESTS
// ============================================================================

Deno.test("stripe-connect-oauth - Action Validation - should accept 'start' action", () => {
  assertEquals(isValidAction("start"), true);
});

Deno.test("stripe-connect-oauth - Action Validation - should accept 'callback' action", () => {
  assertEquals(isValidAction("callback"), true);
});

Deno.test("stripe-connect-oauth - Action Validation - should accept 'disconnect' action", () => {
  assertEquals(isValidAction("disconnect"), true);
});

Deno.test("stripe-connect-oauth - Action Validation - should accept 'status' action", () => {
  assertEquals(isValidAction("status"), true);
});

Deno.test("stripe-connect-oauth - Action Validation - should reject invalid action", () => {
  assertEquals(isValidAction("invalid"), false);
});

Deno.test("stripe-connect-oauth - Action Validation - should reject null action", () => {
  assertEquals(isValidAction(null), false);
});

Deno.test("stripe-connect-oauth - Action Validation - should reject empty string action", () => {
  assertEquals(isValidAction(""), false);
});
