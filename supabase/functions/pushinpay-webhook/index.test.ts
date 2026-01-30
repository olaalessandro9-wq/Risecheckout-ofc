/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for pushinpay-webhook Edge Function
 * 
 * @module pushinpay-webhook/index.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

Deno.test({
  name: "pushinpay-webhook: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-webhook`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
  }
});

Deno.test({
  name: "pushinpay-webhook: Deve rejeitar payload vazio",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: ''
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "pushinpay-webhook: Deve rejeitar JSON inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json {'
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "pushinpay-webhook: Deve rejeitar payload sem event type",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      data: { transactionId: 'test_123' }
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});
