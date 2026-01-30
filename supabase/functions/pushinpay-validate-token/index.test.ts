/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for pushinpay-validate-token Edge Function
 * 
 * @module pushinpay-validate-token/index.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

Deno.test({
  name: "pushinpay-validate-token: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-validate-token`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
  }
});

Deno.test({
  name: "pushinpay-validate-token: Deve rejeitar request sem token",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {};
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-validate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "pushinpay-validate-token: Deve rejeitar token vazio",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = { token: '' };
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-validate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "pushinpay-validate-token: Deve retornar valid=false para token inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = { token: 'invalid_token_123' };
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-validate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    assertEquals(data.valid, false);
  }
});
