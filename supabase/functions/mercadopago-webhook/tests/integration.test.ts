/**
 * Integration Tests - Real HTTP
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 3: Tests against real Edge Function
 * Execution: OPT-IN
 * 
 * @module mercadopago-webhook/tests/integration
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  skipIntegration,
  integrationTestOptions,
  FUNCTION_NAME,
  createValidPayload,
  createInvalidSignatureHeaders,
  createExpiredSignatureHeaders,
} from "./_shared.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

// ============================================================================
// REAL HTTP INTEGRATION TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-webhook/integration: CORS real",
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
  name: "mercadopago-webhook/integration: rejects missing signature (real)",
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
  name: "mercadopago-webhook/integration: rejects invalid signature (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: createInvalidSignatureHeaders(),
      body: JSON.stringify(createValidPayload())
    });
    await response.text();
    
    assertEquals(response.status, 401);
  }
});

Deno.test({
  name: "mercadopago-webhook/integration: rejects expired signature (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: createExpiredSignatureHeaders(),
      body: JSON.stringify(createValidPayload())
    });
    await response.text();
    
    assertEquals(response.status, 401);
  }
});
