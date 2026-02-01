/**
 * CORS Tests for asaas-validate-credentials
 * 
 * @module asaas-validate-credentials/tests/cors.test
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
  name: "asaas-validate-credentials/integration: OPTIONS deve retornar CORS headers",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "OPTIONS",
    });

    await response.text();

    assertEquals(response.status, 200);
    assertExists(response.headers.get("Access-Control-Allow-Origin"));
    assertExists(response.headers.get("Access-Control-Allow-Methods"));
  },
});
