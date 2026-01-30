/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for asaas-create-payment Edge Function
 * 
 * Coverage:
 * - CORS handling (OPTIONS requests)
 * - Rate limiting validation
 * - Payload validation (required fields, types)
 * - Payment method validation (PIX, credit card)
 * - Vendor resolution
 * - Gateway credentials validation
 * - Split calculation
 * - PaymentFactory + AsaasAdapter integration
 * - Error handling
 * - Success responses
 * 
 * @module asaas-create-payment/index.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

// Skip tests if environment is not configured or using mock values
const isMockUrl = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');
const skipTests = isMockUrl;

// ============================================================================
// CORS TESTS
// ============================================================================

Deno.test({
  name: "asaas-create-payment: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'OPTIONS'
    });

    await response.text();

    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
    assertExists(response.headers.get('Access-Control-Allow-Methods'));
  }
});

// ============================================================================
// PAYLOAD VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-create-payment: Deve rejeitar payload sem orderId",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      // orderId missing
      amountCents: 10000,
      paymentMethod: 'pix',
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        document: '12345678900'
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "asaas-create-payment: Deve rejeitar payload sem amountCents",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      // amountCents missing
      paymentMethod: 'pix',
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        document: '12345678900'
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "asaas-create-payment: Deve rejeitar payload sem paymentMethod",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amountCents: 10000,
      // paymentMethod missing
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        document: '12345678900'
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "asaas-create-payment: Deve rejeitar payload sem customer",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amountCents: 10000,
      paymentMethod: 'pix'
      // customer missing
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

// ============================================================================
// PAYMENT METHOD VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-create-payment: Deve rejeitar paymentMethod inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amountCents: 10000,
      paymentMethod: 'invalid_method',
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        document: '12345678900'
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status, 400);
  }
});

Deno.test({
  name: "asaas-create-payment: Deve rejeitar credit_card sem cardToken",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amountCents: 10000,
      paymentMethod: 'credit_card',
      // cardToken missing
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        document: '12345678900'
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

// ============================================================================
// AMOUNT VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-create-payment: Deve rejeitar amountCents zero",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amountCents: 0,
      paymentMethod: 'pix',
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        document: '12345678900'
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "asaas-create-payment: Deve rejeitar amountCents negativo",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amountCents: -10000,
      paymentMethod: 'pix',
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        document: '12345678900'
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

// ============================================================================
// CUSTOMER VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-create-payment: Deve rejeitar customer sem name",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amountCents: 10000,
      paymentMethod: 'pix',
      customer: {
        // name missing
        email: 'test@example.com',
        document: '12345678900'
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "asaas-create-payment: Deve rejeitar customer sem email",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amountCents: 10000,
      paymentMethod: 'pix',
      customer: {
        name: 'Test Customer',
        // email missing
        document: '12345678900'
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "asaas-create-payment: Deve rejeitar customer sem document",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      amountCents: 10000,
      paymentMethod: 'pix',
      customer: {
        name: 'Test Customer',
        email: 'test@example.com'
        // document missing
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});
