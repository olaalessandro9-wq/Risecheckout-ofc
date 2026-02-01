/**
 * Validation Tests for affiliation-public
 * 
 * @module affiliation-public/tests/validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createPayload,
  createFullPayload,
} from "./_shared.ts";

// ============================================================================
// VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "affiliation-public/integration: deve rejeitar sem product_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload(undefined, "test-code")),
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  },
});

Deno.test({
  name: "affiliation-public/integration: deve rejeitar sem affiliate_code",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload("test-product-id", undefined)),
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  },
});

Deno.test({
  name: "affiliation-public/integration: deve rejeitar código inválido",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createFullPayload("test-product-id", "INVALID-CODE-XYZ")),
    });
    await response.text();
    // Deve retornar 404 (não encontrado) ou 400 (inválido)
    assertEquals([400, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "affiliation-public/integration: deve rejeitar afiliação bloqueada",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createFullPayload("test-product-id", "BLOCKED-CODE")),
    });
    await response.text();
    // Pode retornar 400 (bloqueado) ou 404 (não encontrado)
    assertEquals([400, 404].includes(response.status), true);
  },
});
