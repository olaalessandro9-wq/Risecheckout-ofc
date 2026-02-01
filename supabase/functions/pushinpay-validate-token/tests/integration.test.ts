/**
 * Integration Tests - Real HTTP
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 3: Tests against real Edge Function
 * Execution: OPT-IN (only when SUPABASE_URL and RUN_INTEGRATION are present)
 * 
 * @module pushinpay-validate-token/tests/integration
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  skipIntegration,
  integrationTestOptions,
  FUNCTION_NAME,
  createValidRequest,
  createEmptyRequest,
} from "./_shared.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

// ============================================================================
// REAL HTTP INTEGRATION TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-validate-token/integration: CORS real",
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
  name: "pushinpay-validate-token/integration: rejects empty request (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createEmptyRequest())
    });
    await response.text();
    
    assertEquals(response.status, 400);
  }
});

Deno.test({
  name: "pushinpay-validate-token/integration: returns valid=false for fake token (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createValidRequest({ api_token: "fake-invalid-token-xyz" }))
    });
    const data = await response.json();
    
    // Should return 200 with valid=false (not a 4xx error)
    assertEquals(response.status, 200);
    assertEquals(data.valid, false);
  }
});

Deno.test({
  name: "pushinpay-validate-token/integration: rejects non-POST methods (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "GET"
    });
    await response.text();
    
    assertEquals(response.status, 405);
  }
});
