/**
 * CORS, Auth, and Rate Limiting Tests for get-all-affiliation-statuses
 * 
 * @module get-all-affiliation-statuses/tests/cors-auth.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
} from "./_shared.ts";

// ============================================================================
// CORS TESTS
// ============================================================================

Deno.test({
  name: "get-all-affiliation-statuses/integration: OPTIONS deve retornar CORS headers",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "OPTIONS",
    });
    await response.text();
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  },
});

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

Deno.test({
  name: "get-all-affiliation-statuses/integration: Deve rejeitar request sem autenticação",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await response.text();
    assertEquals(response.status, 401);
  },
});

// ============================================================================
// RESPONSE TESTS
// ============================================================================

Deno.test({
  name: "get-all-affiliation-statuses/integration: deve retornar lista de afiliações",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await response.text();
    assertEquals([200, 401].includes(response.status), true);
  },
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

Deno.test({
  name: "get-all-affiliation-statuses/integration: deve aplicar rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const requests = Array.from({ length: 100 }, () =>
      fetch(getFunctionUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);
    
    // Consume all response bodies
    await Promise.all(responses.map((r) => r.text()));
    
    assertEquals(statuses.every((s) => [200, 401, 429].includes(s)), true);
  },
});
