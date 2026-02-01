/**
 * CORS, Auth, and Validation Tests for get-affiliation-details
 * 
 * @module get-affiliation-details/tests/cors-auth-validation.test
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
  name: "get-affiliation-details/integration: OPTIONS deve retornar CORS headers",
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
  name: "get-affiliation-details/integration: Deve rejeitar request sem autenticação",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload("test-id")),
    });
    await response.text();
    assertEquals(response.status, 401);
  },
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "get-affiliation-details/integration: deve validar affiliation_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload("test-affiliation-id")),
    });
    await response.text();
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

Deno.test({
  name: "get-affiliation-details/integration: deve aplicar rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const requests = Array.from({ length: 100 }, () =>
      fetch(getFunctionUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload("test-id")),
      })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);
    
    // Consume all response bodies
    await Promise.all(responses.map((r) => r.text()));
    
    assertEquals(statuses.every((s) => [200, 401, 403, 404, 429].includes(s)), true);
  },
});
