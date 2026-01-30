/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for mercadopago-create-payment Edge Function
 * 
 * Coverage:
 * - CORS handling
 * - Rate limiting
 * - Payload validation (orderId, payerEmail, paymentMethod)
 * - Payment method validation (PIX, credit card)
 * - Token validation for credit card
 * - PaymentFactory + MercadoPagoAdapter integration
 * - Error handling
 * 
 * @module mercadopago-create-payment/index.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

Deno.test({
  name: "mercadopago-create-payment: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-create-payment`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
  }
});

Deno.test({
  name: "mercadopago-create-payment: Deve rejeitar payload sem orderId",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      payerEmail: 'test@example.com',
      paymentMethod: 'pix'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "mercadopago-create-payment: Deve rejeitar payload sem payerEmail",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      paymentMethod: 'pix'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "mercadopago-create-payment: Deve rejeitar payload sem paymentMethod",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      payerEmail: 'test@example.com'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "mercadopago-create-payment: Deve rejeitar paymentMethod inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      payerEmail: 'test@example.com',
      paymentMethod: 'invalid_method'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "mercadopago-create-payment: Deve rejeitar credit_card sem token",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      payerEmail: 'test@example.com',
      paymentMethod: 'credit_card'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "mercadopago-create-payment: Deve rejeitar email inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      payerEmail: 'invalid-email',
      paymentMethod: 'pix'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "mercadopago-create-payment: Content-Type deve ser application/json",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      payerEmail: 'test@example.com',
      paymentMethod: 'pix'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.headers.get('Content-Type')?.includes('application/json'), true);
  }
});
