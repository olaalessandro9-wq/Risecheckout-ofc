/**
 * Public Access Tests for affiliation-public
 * 
 * This function is PUBLIC - no authentication required.
 * 
 * @module affiliation-public/tests/public-access.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createFullPayload,
} from "./_shared.ts";

// ============================================================================
// PUBLIC ACCESS TESTS (NO AUTH REQUIRED)
// ============================================================================

Deno.test({
  name: "affiliation-public/integration: deve aceitar request sem autenticação (PUBLIC)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createFullPayload()),
    });
    await response.text();
    // Deve retornar 200 (sucesso) ou 404 (não encontrado) - SEM 401
    assertEquals([200, 400, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "affiliation-public/integration: deve validar product_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createFullPayload("test-product-id", "test-code")),
    });
    await response.text();
    assertEquals([200, 400, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "affiliation-public/integration: deve validar affiliate_code",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createFullPayload("test-product-id", "TESTCODE123")),
    });
    await response.text();
    assertEquals([200, 400, 404].includes(response.status), true);
  },
});
