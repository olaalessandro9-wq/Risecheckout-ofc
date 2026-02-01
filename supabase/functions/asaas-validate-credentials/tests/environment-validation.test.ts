/**
 * Environment Validation Tests for asaas-validate-credentials
 * 
 * @module asaas-validate-credentials/tests/environment-validation.test
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
// ENVIRONMENT VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-validate-credentials/integration: Deve rejeitar request sem environment",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ environment: undefined });
    delete payload.environment;

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
  name: "asaas-validate-credentials/integration: Deve rejeitar environment inválido",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({ environment: "invalid_env" });

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
  name: "asaas-validate-credentials/integration: Deve aceitar environment 'sandbox'",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({
      apiKey: "invalid_key_for_test",
      environment: "sandbox",
    });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.json();

    // Should not return 400 for environment validation (401 is acceptable - invalid key)
    assertEquals(response.status === 200 || response.status === 401 || response.status === 500, true);
  },
});

Deno.test({
  name: "asaas-validate-credentials/integration: Deve aceitar environment 'production'",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload({
      apiKey: "invalid_key_for_test",
      environment: "production",
    });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.json();

    // Should not return 400 for environment validation (401 is acceptable - invalid key)
    assertEquals(response.status === 200 || response.status === 401 || response.status === 500, true);
  },
});
