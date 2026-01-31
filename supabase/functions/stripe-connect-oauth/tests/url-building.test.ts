/**
 * URL Building Tests for stripe-connect-oauth
 * 
 * @module stripe-connect-oauth/tests/url-building.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildStripeConnectUrl,
  buildRedirectUrl,
  MOCK_STATE,
  MOCK_STRIPE_ACCOUNT_ID,
} from "./_shared.ts";

// ============================================================================
// URL BUILDING TESTS
// ============================================================================

Deno.test("stripe-connect-oauth - URL Building - should build correct authorization URL", () => {
  const url = buildStripeConnectUrl({
    clientId: "ca_test_client",
    redirectUri: "https://api.example.com/callback",
    state: MOCK_STATE,
  });

  assertStringIncludes(url, "https://connect.stripe.com/oauth/authorize");
  assertStringIncludes(url, "response_type=code");
  assertStringIncludes(url, "client_id=ca_test_client");
  assertStringIncludes(url, "scope=read_write");
  assertStringIncludes(url, `state=${MOCK_STATE}`);
});

Deno.test("stripe-connect-oauth - URL Building - should URL encode redirect_uri", () => {
  const url = buildStripeConnectUrl({
    clientId: "ca_test",
    redirectUri: "https://api.example.com/stripe/callback",
    state: "test",
  });

  assertStringIncludes(url, "redirect_uri=https%3A%2F%2Fapi.example.com%2Fstripe%2Fcallback");
});

Deno.test("stripe-connect-oauth - URL Building - should build success redirect URL", () => {
  const url = buildRedirectUrl({
    frontendUrl: "https://app.example.com",
    success: true,
    accountId: MOCK_STRIPE_ACCOUNT_ID,
  });

  assertEquals(
    url,
    `https://app.example.com/dashboard/financeiro?stripe_success=true&account=${MOCK_STRIPE_ACCOUNT_ID}`
  );
});

Deno.test("stripe-connect-oauth - URL Building - should build error redirect URL", () => {
  const url = buildRedirectUrl({
    frontendUrl: "https://app.example.com",
    success: false,
    error: "access_denied",
  });

  assertEquals(
    url,
    "https://app.example.com/dashboard/financeiro?stripe_error=access_denied"
  );
});

Deno.test("stripe-connect-oauth - URL Building - should encode special characters in error message", () => {
  const url = buildRedirectUrl({
    frontendUrl: "https://app.example.com",
    success: false,
    error: "User denied access & closed window",
  });

  assertStringIncludes(url, "User%20denied%20access%20%26%20closed%20window");
});
