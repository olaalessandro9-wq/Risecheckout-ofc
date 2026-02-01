/**
 * Payment Method Validation Tests for asaas-create-payment
 * 
 * @module asaas-create-payment/tests/payment-method-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createPayload,
} from "./_shared.ts";

// ============================================================================
// PAYMENT METHOD VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-create-payment/integration: Deve rejeitar paymentMethod inválido",
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
    assertEquals(response.status, 400);
  },
});

Deno.test({
  name: "asaas-create-payment/integration: Deve rejeitar credit_card sem cardToken",
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

// ============================================================================
// AMOUNT VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-create-payment/integration: Deve rejeitar amountCents zero",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ amountCents: 0 });

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
  name: "asaas-create-payment/integration: Deve rejeitar amountCents negativo",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ amountCents: -10000 });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  },
});
