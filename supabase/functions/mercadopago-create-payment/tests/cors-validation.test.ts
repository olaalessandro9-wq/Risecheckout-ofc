/**
 * CORS and Payload Validation Tests for mercadopago-create-payment
 * 
 * @module mercadopago-create-payment/tests/cors-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createPayload,
} from "./_shared.ts";

// ============================================================================
// CORS TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-create-payment/integration: OPTIONS deve retornar CORS headers",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "OPTIONS",
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get("Access-Control-Allow-Origin"));
  },
});

// ============================================================================
// PAYLOAD VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-create-payment/integration: Deve rejeitar payload sem orderId",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ orderId: undefined });
    delete payload.orderId;

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  },
});

Deno.test({
  name: "mercadopago-create-payment/integration: Deve rejeitar payload sem payerEmail",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ payerEmail: undefined });
    delete payload.payerEmail;

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  },
});

Deno.test({
  name: "mercadopago-create-payment/integration: Deve rejeitar payload sem paymentMethod",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ paymentMethod: undefined });
    delete payload.paymentMethod;

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  },
});

Deno.test({
  name: "mercadopago-create-payment/integration: Deve rejeitar paymentMethod inválido",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ paymentMethod: "invalid_method" });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  },
});

Deno.test({
  name: "mercadopago-create-payment/integration: Deve rejeitar credit_card sem token",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ paymentMethod: "credit_card" });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  },
});

Deno.test({
  name: "mercadopago-create-payment/integration: Deve rejeitar email inválido",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ payerEmail: "invalid-email" });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  },
});

Deno.test({
  name: "mercadopago-create-payment/integration: Content-Type deve ser application/json",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload();

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await response.text();
    assertEquals(response.headers.get("Content-Type")?.includes("application/json"), true);
  },
});
