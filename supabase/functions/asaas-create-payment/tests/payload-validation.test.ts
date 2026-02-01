/**
 * Payload Validation Tests for asaas-create-payment
 * 
 * @module asaas-create-payment/tests/payload-validation.test
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
// REQUIRED FIELDS VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-create-payment/integration: Deve rejeitar payload sem orderId",
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
  name: "asaas-create-payment/integration: Deve rejeitar payload sem amountCents",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ amountCents: undefined });
    delete payload.amountCents;

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
  name: "asaas-create-payment/integration: Deve rejeitar payload sem paymentMethod",
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
  name: "asaas-create-payment/integration: Deve rejeitar payload sem customer",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ customer: undefined });
    delete payload.customer;

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  },
});
