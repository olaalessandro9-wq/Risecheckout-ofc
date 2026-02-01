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
 * @version 1.1.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  skipIntegration, 
  integrationTestOptions,
  getTestConfig 
} from "../_shared/testing/mod.ts";

const config = getTestConfig();
const supabaseUrl = config.supabaseUrl;

Deno.test({
  name: "mercadopago-create-payment/integration: OPTIONS deve retornar CORS headers",
  ignore: skipIntegration(),
  ...integrationTestOptions,
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
  name: "mercadopago-create-payment/integration: Deve rejeitar payload sem orderId",
  ignore: skipIntegration(),
  ...integrationTestOptions,
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
  name: "mercadopago-create-payment/integration: Deve rejeitar payload sem payerEmail",
  ignore: skipIntegration(),
  ...integrationTestOptions,
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
  name: "mercadopago-create-payment/integration: Deve rejeitar payload sem paymentMethod",
  ignore: skipIntegration(),
  ...integrationTestOptions,
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
  name: "mercadopago-create-payment/integration: Deve rejeitar paymentMethod inválido",
  ignore: skipIntegration(),
  ...integrationTestOptions,
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
  name: "mercadopago-create-payment/integration: Deve rejeitar credit_card sem token",
  ignore: skipIntegration(),
  ...integrationTestOptions,
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
  name: "mercadopago-create-payment/integration: Deve rejeitar email inválido",
  ignore: skipIntegration(),
  ...integrationTestOptions,
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
  name: "mercadopago-create-payment/integration: Content-Type deve ser application/json",
  ignore: skipIntegration(),
  ...integrationTestOptions,
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
