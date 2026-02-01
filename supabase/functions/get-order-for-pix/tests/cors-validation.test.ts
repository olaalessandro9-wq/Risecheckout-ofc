/**
 * CORS and Validation Tests for get-order-for-pix
 * 
 * @module get-order-for-pix/tests/cors-validation.test
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
  name: "get-order-for-pix/integration: OPTIONS deve retornar CORS headers",
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
// ORDER ID VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "get-order-for-pix/integration: Deve rejeitar request sem orderId",
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
  name: "get-order-for-pix/integration: Deve rejeitar orderId vazio",
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
  name: "get-order-for-pix/integration: Deve retornar 404 para orderId inexistente",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl("nonexistent_order_123"), {
      method: "GET",
    });
    await response.text();
    assertEquals(response.status, 404);
  },
});

Deno.test({
  name: "get-order-for-pix/integration: Content-Type deve ser application/json",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl("test_order_123"), {
      method: "GET",
    });
    await response.text();
    assertEquals(response.headers.get("Content-Type")?.includes("application/json"), true);
  },
});
