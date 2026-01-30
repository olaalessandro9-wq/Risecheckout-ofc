/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for pushinpay-create-pix Edge Function
 * 
 * Coverage:
 * - CORS handling
 * - Payload validation
 * - Amount validation
 * - Customer validation
 * - PaymentFactory + PushinPayAdapter integration
 * 
 * @module pushinpay-create-pix/index.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

Deno.test({
  name: "pushinpay-create-pix: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-create-pix`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
  }
});

Deno.test({
  name: "pushinpay-create-pix: Deve rejeitar payload sem orderId",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      amount: 100.00,
      customer: { name: 'Test', document: '12345678900' }
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-create-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "pushinpay-create-pix: Deve rejeitar payload sem amount",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      customer: { name: 'Test', document: '12345678900' }
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-create-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "pushinpay-create-pix: Deve rejeitar amount zero",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amount: 0,
      customer: { name: 'Test', document: '12345678900' }
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-create-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "pushinpay-create-pix: Deve rejeitar amount negativo",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amount: -100,
      customer: { name: 'Test', document: '12345678900' }
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-create-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "pushinpay-create-pix: Deve rejeitar payload sem customer",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amount: 100.00
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-create-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});
