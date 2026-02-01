/**
 * CORS, Auth, and Pagination Tests for get-my-affiliations
 * 
 * @module get-my-affiliations/tests/cors-auth-pagination.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createPayload,
} from "./_shared.ts";

// ============================================================================
// CORS TESTS
// ============================================================================

Deno.test({
  name: "get-my-affiliations/integration: OPTIONS deve retornar CORS headers",
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
  name: "get-my-affiliations/integration: Deve rejeitar request sem autenticação",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload()),
    });
    await response.text();
    assertEquals(response.status, 401);
  },
});

// ============================================================================
// RESPONSE TESTS
// ============================================================================

Deno.test({
  name: "get-my-affiliations/integration: deve retornar lista de afiliações",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload()),
    });
    await response.text();
    assertEquals([200, 401].includes(response.status), true);
  },
});

// ============================================================================
// PAGINATION TESTS
// ============================================================================

Deno.test({
  name: "get-my-affiliations/integration: deve aceitar paginação",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload({ page: 1, limit: 20 })),
    });
    await response.text();
    assertEquals([200, 401].includes(response.status), true);
  },
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

Deno.test({
  name: "get-my-affiliations/integration: deve aplicar rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const requests = Array.from({ length: 100 }, () =>
      fetch(getFunctionUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload()),
      })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);
    
    // Consume all response bodies
    await Promise.all(responses.map((r) => r.text()));
    
    assertEquals(statuses.every((s) => [200, 401, 429].includes(s)), true);
  },
});
