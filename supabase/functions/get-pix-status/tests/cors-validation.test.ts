/**
 * CORS and Validation Tests for get-pix-status
 * 
 * @module get-pix-status/tests/cors-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
} from "./_shared.ts";

// ============================================================================
// CORS TESTS
// ============================================================================

Deno.test({
  name: "get-pix-status/integration: OPTIONS deve retornar CORS headers",
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
// TRANSACTION ID VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "get-pix-status/integration: Deve rejeitar request sem transactionId",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "GET",
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  },
});

Deno.test({
  name: "get-pix-status/integration: Deve rejeitar transactionId vazio",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(""), {
      method: "GET",
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  },
});

Deno.test({
  name: "get-pix-status/integration: Deve retornar 404 para transactionId inexistente",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl("nonexistent_tx_123"), {
      method: "GET",
    });
    await response.text();
    assertEquals(response.status, 404);
  },
});

Deno.test({
  name: "get-pix-status/integration: Content-Type deve ser application/json",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl("test_tx_123"), {
      method: "GET",
    });
    await response.text();
    assertEquals(response.headers.get("Content-Type")?.includes("application/json"), true);
  },
});

Deno.test({
  name: "get-pix-status/integration: Deve rejeitar request sem gateway",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl("test_tx_123"), {
      method: "GET",
    });
    await response.text();
    // Should fail if gateway is not specified or cannot be determined
    assertEquals(response.status >= 400 || response.status === 404, true);
  },
});
