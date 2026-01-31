/**
 * Redirect Domain Validation Tests for mercadopago-oauth-callback
 * 
 * @module mercadopago-oauth-callback/tests/redirect-domain.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isAllowedRedirectDomain } from "./_shared.ts";

// ============================================================================
// REDIRECT DOMAIN VALIDATION TESTS
// ============================================================================

Deno.test("mercadopago-oauth-callback - Redirect Domain - should allow risecheckout.com", () => {
  assertEquals(isAllowedRedirectDomain("https://risecheckout.com"), true);
});

Deno.test("mercadopago-oauth-callback - Redirect Domain - should allow www.risecheckout.com", () => {
  assertEquals(isAllowedRedirectDomain("https://www.risecheckout.com"), true);
});

Deno.test("mercadopago-oauth-callback - Redirect Domain - should allow lovable.app", () => {
  assertEquals(isAllowedRedirectDomain("https://lovable.app"), true);
});

Deno.test("mercadopago-oauth-callback - Redirect Domain - should allow subdomains of lovable.app", () => {
  assertEquals(isAllowedRedirectDomain("https://preview.lovable.app"), true);
});

Deno.test("mercadopago-oauth-callback - Redirect Domain - should reject unknown domains", () => {
  assertEquals(isAllowedRedirectDomain("https://evil.com"), false);
});

Deno.test("mercadopago-oauth-callback - Redirect Domain - should reject similar but different domains", () => {
  assertEquals(isAllowedRedirectDomain("https://risecheckout.com.evil.com"), false);
});

Deno.test("mercadopago-oauth-callback - Redirect Domain - should handle invalid URLs gracefully", () => {
  assertEquals(isAllowedRedirectDomain("not-a-url"), false);
});

Deno.test("mercadopago-oauth-callback - Redirect Domain - should handle empty strings", () => {
  assertEquals(isAllowedRedirectDomain(""), false);
});
