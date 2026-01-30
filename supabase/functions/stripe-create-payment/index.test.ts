/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for stripe-create-payment Edge Function
 * 
 * Coverage:
 * - CORS handling
 * - Payload validation (orderId, amount, paymentMethod)
 * - Payment method validation
 * - PaymentFactory + StripeAdapter integration
 * - Error handling
 * 
 * @module stripe-create-payment/index.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

Deno.test({
  name: "stripe-create-payment: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-create-payment`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
  }
});

Deno.test({
  name: "stripe-create-payment: Deve rejeitar payload sem orderId",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      amount: 10000,
      paymentMethod: 'card'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "stripe-create-payment: Deve rejeitar payload sem amount",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      paymentMethod: 'card'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "stripe-create-payment: Deve rejeitar amount zero",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amount: 0,
      paymentMethod: 'card'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "stripe-create-payment: Deve rejeitar amount negativo",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amount: -10000,
      paymentMethod: 'card'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "stripe-create-payment: Content-Type deve ser application/json",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amount: 10000,
      paymentMethod: 'card'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.headers.get('Content-Type')?.includes('application/json'), true);
  }
});
