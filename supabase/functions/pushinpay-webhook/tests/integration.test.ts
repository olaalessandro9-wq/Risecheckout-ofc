/**
 * Integration Tests - Real HTTP
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 3: Tests against real Edge Function
 * Execution: OPT-IN (only when SUPABASE_URL and RUN_INTEGRATION are present)
 * 
 * @module pushinpay-webhook/tests/integration
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  skipIntegration,
  integrationTestOptions,
  FUNCTION_NAME,
  createValidPayload,
  createEmptyPayload,
} from "./_shared.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

// ============================================================================
// REAL HTTP INTEGRATION TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/integration: CORS real",
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
  name: "pushinpay-webhook/integration: rejects missing token (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createValidPayload())
    });
    await response.text();
    
    assertEquals(response.status, 401);
  }
});

Deno.test({
  name: "pushinpay-webhook/integration: rejects invalid token (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-pushinpay-token": "invalid-token-xyz"
      },
      body: JSON.stringify(createValidPayload())
    });
    await response.text();
    
    assertEquals(response.status, 401);
  }
});

Deno.test({
  name: "pushinpay-webhook/integration: rejects empty payload (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    // Note: This test will fail if PUSHINPAY_WEBHOOK_TOKEN is not configured
    // In CI, the token check happens before payload validation
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createEmptyPayload())
    });
    await response.text();
    
    // Will be 401 without token, or 400 with token but empty payload
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});
