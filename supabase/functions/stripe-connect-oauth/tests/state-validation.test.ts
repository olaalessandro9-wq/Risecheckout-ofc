/**
 * State Validation Tests for stripe-connect-oauth
 * 
 * @module stripe-connect-oauth/tests/state-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validateOAuthState,
  mockOAuthState,
  mockExpiredState,
  mockUsedState,
  OAuthStateRecord,
} from "./_shared.ts";

// ============================================================================
// STATE VALIDATION TESTS
// ============================================================================

Deno.test("stripe-connect-oauth - State Validation - should accept valid unexpired state", () => {
  const result = validateOAuthState(mockOAuthState);
  assertEquals(result.valid, true);
  assertEquals(result.error, undefined);
});

Deno.test("stripe-connect-oauth - State Validation - should reject null state", () => {
  const result = validateOAuthState(null);
  assertEquals(result.valid, false);
  assertEquals(result.error, "Invalid OAuth state");
});

Deno.test("stripe-connect-oauth - State Validation - should reject already used state", () => {
  const result = validateOAuthState(mockUsedState);
  assertEquals(result.valid, false);
  assertEquals(result.error, "OAuth state already used");
});

Deno.test("stripe-connect-oauth - State Validation - should reject expired state", () => {
  const result = validateOAuthState(mockExpiredState);
  assertEquals(result.valid, false);
  assertEquals(result.error, "OAuth state expired");
});

Deno.test("stripe-connect-oauth - State Validation - should validate state with exact expiration time boundary", () => {
  const boundaryState: OAuthStateRecord = {
    ...mockOAuthState,
    expires_at: new Date(Date.now() + 1).toISOString(),
  };
  const result = validateOAuthState(boundaryState);
  assertEquals(result.valid, true);
});
