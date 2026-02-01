/**
 * Integration Tests for create-order Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Real HTTP integration tests that require:
 * 1. SUPABASE_URL environment variable
 * 2. RUN_INTEGRATION_TESTS=true environment variable
 * 3. The Edge Function to be deployed
 * 
 * Tests are skipped in CI environments without proper configuration.
 * 
 * @module create-order/tests/integration
 * @version 2.0.0
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  skipIntegration,
  integrationTestOptions,
  FUNCTION_NAME,
  createValidPayload,
  createInvalidPayload,
  createHeaders,
} from "./_shared.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// ============================================================================
// CORS TESTS
// ============================================================================

Deno.test({
  name: "create-order/integration: CORS preflight returns 200",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:5173",
      },
    });
    
    await response.text();
    
    assertEquals(response.status, 200);
    assertExists(response.headers.get("Access-Control-Allow-Origin"));
  },
});

// ============================================================================
// SUCCESS FLOW TESTS
// ============================================================================

Deno.test({
  name: "create-order/integration: creates order with valid payload",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createValidPayload();
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: createHeaders(SUPABASE_ANON_KEY),
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    assertEquals(response.status, 200);
    assertExists(data.order_id);
    assertEquals(data.success, true);
  },
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "create-order/integration: returns 400 for invalid payload",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createInvalidPayload();
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: createHeaders(SUPABASE_ANON_KEY),
      body: JSON.stringify(payload),
    });
    
    await response.json();
    
    assertEquals(response.status, 400);
  },
});

Deno.test({
  name: "create-order/integration: returns 400 for empty body",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: createHeaders(SUPABASE_ANON_KEY),
      body: JSON.stringify({}),
    });
    
    await response.json();
    
    assertEquals(response.status, 400);
  },
});

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

Deno.test({
  name: "create-order/integration: accepts anonymous requests (public endpoint)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createValidPayload();
    
    // Create-order is a public endpoint (checkout flow)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: createHeaders(SUPABASE_ANON_KEY),
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    // Should succeed or fail with validation error, not 401
    assertEquals([200, 400, 404].includes(response.status), true);
    await response.text().catch(() => void data);
  },
});
