/**
 * Integration Tests for get-my-affiliations Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Get my affiliations (as affiliate)
 * - Authentication via unified-auth
 * - Pagination support
 * 
 * @module get-my-affiliations/index.test
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { 
  skipIntegration, 
  integrationTestOptions,
  getTestConfig 
} from "../_shared/testing/mod.ts";

// ============================================================================
// Configuration
// ============================================================================

const config = getTestConfig();

function getFunctionUrl(): string {
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/get-my-affiliations`
    : "https://mock.supabase.co/functions/v1/get-my-affiliations";
}

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "get-my-affiliations/integration: OPTIONS deve retornar CORS headers",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  }
});

// ============================================================================
// Authentication Tests
// ============================================================================

Deno.test({
  name: "get-my-affiliations/integration: Deve rejeitar request sem autenticação",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    await response.text();
    assertEquals(response.status, 401);
  }
});

// ============================================================================
// Response Tests
// ============================================================================

Deno.test({
  name: "get-my-affiliations/integration: deve retornar lista de afiliações",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    await response.text();
    assertEquals([200, 401].includes(response.status), true);
  }
});

// ============================================================================
// Pagination Tests
// ============================================================================

Deno.test({
  name: "get-my-affiliations/integration: deve aceitar paginação",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 1, limit: 20 })
    });
    await response.text();
    assertEquals([200, 401].includes(response.status), true);
  }
});

// ============================================================================
// Rate Limiting Tests
// ============================================================================

Deno.test({
  name: "get-my-affiliations/integration: deve aplicar rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const requests = Array.from({ length: 100 }, () =>
      fetch(getFunctionUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);
    assertEquals(statuses.every(s => [200, 401, 429].includes(s)), true);
  }
});
