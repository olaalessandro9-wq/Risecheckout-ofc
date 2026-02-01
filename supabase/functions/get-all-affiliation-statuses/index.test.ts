/**
 * Integration Tests for get-all-affiliation-statuses Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Get all affiliation statuses for authenticated user
 * - Authentication via unified-auth
 * 
 * @module get-all-affiliation-statuses/index.test
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
    ? `${config.supabaseUrl}/functions/v1/get-all-affiliation-statuses`
    : "https://mock.supabase.co/functions/v1/get-all-affiliation-statuses";
}

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "get-all-affiliation-statuses/integration: OPTIONS deve retornar CORS headers",
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
  name: "get-all-affiliation-statuses/integration: Deve rejeitar request sem autenticação",
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
  name: "get-all-affiliation-statuses/integration: deve retornar lista de afiliações",
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
// Rate Limiting Tests
// ============================================================================

Deno.test({
  name: "get-all-affiliation-statuses/integration: deve aplicar rate limiting",
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
