/**
 * Customer Validation Tests for asaas-create-payment
 * 
 * @module asaas-create-payment/tests/customer-validation.test
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
// CUSTOMER VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-create-payment/integration: Deve rejeitar customer sem name",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({
      customer: {
        email: "test@example.com",
        document: "12345678900",
      },
    });

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
  name: "asaas-create-payment/integration: Deve rejeitar customer sem email",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({
      customer: {
        name: "Test Customer",
        document: "12345678900",
      },
    });

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
  name: "asaas-create-payment/integration: Deve rejeitar customer sem document",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({
      customer: {
        name: "Test Customer",
        email: "test@example.com",
      },
    });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  },
});
