/**
 * Integration Tests - Real HTTP
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 3: Tests against real Edge Function
 * Execution: OPT-IN (only when SUPABASE_URL and RUN_INTEGRATION are present)
 * 
 * @module reconcile-pending-orders/tests/integration
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  FUNCTION_NAME,
  createUnauthHeaders,
  createInvalidSecretHeaders,
} from "./_shared.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

// ============================================================================
// REAL HTTP INTEGRATION TESTS
// ============================================================================

Deno.test({
  name: "reconcile-pending-orders/integration: CORS real",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "OPTIONS"
    });
    await response.text();
    
    assertEquals(response.status, 200);
    assertExists(response.headers.get("Access-Control-Allow-Origin"));
  }
});

Deno.test({
  name: "reconcile-pending-orders/integration: rejects missing secret (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: createUnauthHeaders(),
      body: JSON.stringify({})
    });
    await response.text();
    
    assertEquals(response.status, 401);
  }
});

Deno.test({
  name: "reconcile-pending-orders/integration: rejects invalid secret (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: createInvalidSecretHeaders(),
      body: JSON.stringify({})
    });
    await response.text();
    
    assertEquals(response.status, 401);
  }
});

// Note: Success tests require valid INTERNAL_WEBHOOK_SECRET configured
// These are intentionally skipped in CI for security
