/**
 * Integration Tests - Real HTTP
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 3: Tests against real Edge Function
 * Execution: OPT-IN
 * 
 * @module asaas-webhook/tests/integration
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  skipIntegration,
  integrationTestOptions,
  FUNCTION_NAME,
  createValidPayload,
  createPayloadWithoutPayment,
} from "./_shared.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

// ============================================================================
// REAL HTTP INTEGRATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-webhook/integration: CORS real",
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
  name: "asaas-webhook/integration: rejects missing token (real)",
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
  name: "asaas-webhook/integration: rejects invalid token (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "asaas-access-token": "invalid-token-xyz"
      },
      body: JSON.stringify(createValidPayload())
    });
    await response.text();
    
    assertEquals(response.status, 401);
  }
});

Deno.test({
  name: "asaas-webhook/integration: accepts payload without payment (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    // This requires a valid token configured in the environment
    const token = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    if (!token) {
      return; // Skip if no token
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "asaas-access-token": token
      },
      body: JSON.stringify(createPayloadWithoutPayment())
    });
    const data = await response.json();
    
    assertEquals(response.status, 200);
    assertEquals(data.success || data.received, true);
  }
});
