/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for mercadopago-oauth-callback Edge Function
 * 
 * Coverage:
 * - CORS handling
 * - OAuth code validation
 * - State parameter validation
 * - Token exchange
 * - Error handling
 * 
 * @module mercadopago-oauth-callback/index.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

Deno.test({
  name: "mercadopago-oauth-callback: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-oauth-callback`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
  }
});

Deno.test({
  name: "mercadopago-oauth-callback: Deve rejeitar request sem code",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-oauth-callback?state=test_state`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "mercadopago-oauth-callback: Deve rejeitar request sem state",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-oauth-callback?code=test_code`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "mercadopago-oauth-callback: Deve rejeitar code inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-oauth-callback?code=invalid_code&state=test_state`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "mercadopago-oauth-callback: Deve rejeitar state inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-oauth-callback?code=test_code&state=invalid_state`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});
