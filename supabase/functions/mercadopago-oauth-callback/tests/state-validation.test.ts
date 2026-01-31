/**
 * State Validation Tests for mercadopago-oauth-callback
 * 
 * @module mercadopago-oauth-callback/tests/state-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validateOAuthState,
  mockValidState,
  mockExpiredState,
  mockUsedState,
  MOCK_VENDOR_ID,
} from "./_shared.ts";

// ============================================================================
// STATE VALIDATION TESTS
// ============================================================================

Deno.test("mercadopago-oauth-callback - State Validation - should accept valid unexpired state", () => {
  const result = validateOAuthState(mockValidState);
  assertEquals(result.valid, true);
  assertEquals(result.vendorId, MOCK_VENDOR_ID);
});

Deno.test("mercadopago-oauth-callback - State Validation - should reject null state", () => {
  const result = validateOAuthState(null);
  assertEquals(result.valid, false);
  assertExists(result.error);
});

Deno.test("mercadopago-oauth-callback - State Validation - should reject expired state", () => {
  const result = validateOAuthState(mockExpiredState);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Sessão expirada");
});

Deno.test("mercadopago-oauth-callback - State Validation - should reject already used state", () => {
  const result = validateOAuthState(mockUsedState);
  assertEquals(result.valid, false);
  assertStringIncludes(result.error!, "utilizado");
});

Deno.test("mercadopago-oauth-callback - State Validation - should return vendorId for valid state", () => {
  const result = validateOAuthState(mockValidState);
  assertEquals(result.vendorId, MOCK_VENDOR_ID);
});
