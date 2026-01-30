/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for stripe-connect-oauth Edge Function
 * 
 * Coverage:
 * - CORS handling
 * - OAuth code validation
 * - State parameter validation
 * - Token exchange with Stripe
 * - Error handling
 * 
 * @module stripe-connect-oauth/index.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

Deno.test({
  name: "stripe-connect-oauth: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-connect-oauth`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
  }
});

Deno.test({
  name: "stripe-connect-oauth: Deve rejeitar request sem code",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-connect-oauth?state=test_state`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "stripe-connect-oauth: Deve rejeitar request sem state",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-connect-oauth?code=test_code`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "stripe-connect-oauth: Deve rejeitar code vazio",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-connect-oauth?code=&state=test_state`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "stripe-connect-oauth: Deve rejeitar state vazio",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-connect-oauth?code=test_code&state=`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "stripe-connect-oauth: Deve rejeitar code inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-connect-oauth?code=invalid_code_123&state=test_state`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "stripe-connect-oauth: Deve rejeitar state inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-connect-oauth?code=test_code&state=invalid_state_123`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "stripe-connect-oauth: Deve lidar com error parameter",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-connect-oauth?error=access_denied&state=test_state`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});
