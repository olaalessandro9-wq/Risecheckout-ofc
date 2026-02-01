/**
 * Certificate Generation Tests for members-area-certificates
 * 
 * @module members-area-certificates/tests/generation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createPayload,
} from "./_shared.ts";

// ============================================================================
// GENERATE CERTIFICATE TESTS
// ============================================================================

Deno.test({
  name: "members-area-certificates/integration: generate - deve rejeitar sem product_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("generate");

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    assertEquals(response.status, 400);
    assertExists(data.error);
  },
});

Deno.test({
  name: "members-area-certificates/integration: generate - deve validar product_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("generate", { product_id: "test-product-id" });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401].includes(response.status), true);
  },
});
