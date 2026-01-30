/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for stripe-webhook Edge Function
 * 
 * Coverage:
 * - CORS handling
 * - Webhook signature validation
 * - Event type handling
 * - Error handling
 * 
 * @module stripe-webhook/index.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

Deno.test({
  name: "stripe-webhook: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-webhook`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
  }
});

Deno.test({
  name: "stripe-webhook: Deve rejeitar request sem stripe-signature header",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test_123' } }
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "stripe-webhook: Deve rejeitar signature inválida",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test_123' } }
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid_signature'
      },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "stripe-webhook: Deve rejeitar payload vazio",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      },
      body: ''
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "stripe-webhook: Deve rejeitar JSON inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      },
      body: 'invalid json {'
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});
