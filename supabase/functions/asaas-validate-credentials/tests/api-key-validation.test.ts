/**
 * API Key Validation Tests for asaas-validate-credentials
 * 
 * @module asaas-validate-credentials/tests/api-key-validation.test
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
// API KEY VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-validate-credentials/integration: Deve rejeitar request sem apiKey",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ apiKey: undefined });
    delete payload.apiKey;

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    assertEquals(response.status, 400);
    assertEquals(data.valid, false);
    assertExists(data.message);
  },
});

Deno.test({
  name: "asaas-validate-credentials/integration: Deve rejeitar apiKey vazia",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ apiKey: "" });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    assertEquals(response.status, 400);
    assertEquals(data.valid, false);
    assertExists(data.message);
  },
});

Deno.test({
  name: "asaas-validate-credentials/integration: Deve rejeitar apiKey com apenas espaços",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ apiKey: "   " });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    assertEquals(response.status, 400);
    assertEquals(data.valid, false);
    assertExists(data.message);
  },
});
