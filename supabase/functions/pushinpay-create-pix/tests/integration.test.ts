/**
 * Integration Tests - Real HTTP
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 3: Tests against real Edge Function
 * Execution: OPT-IN (only when SUPABASE_URL and RUN_INTEGRATION are present)
 * 
 * @module pushinpay-create-pix/tests/integration
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  FUNCTION_NAME,
  createValidRequest,
  createEmptyRequest,
  createZeroValueRequest,
} from "./_shared.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

// ============================================================================
// REAL HTTP INTEGRATION TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-create-pix/integration: CORS real",
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
  name: "pushinpay-create-pix/integration: rejects empty body (real)",
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
  name: "pushinpay-create-pix/integration: rejects zero value (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createZeroValueRequest())
    });
    await response.text();
    
    assertEquals(response.status, 400);
  }
});

Deno.test({
  name: "pushinpay-create-pix/integration: rejects invalid orderId (real)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createValidRequest("invalid-order-id-12345", 10000))
    });
    await response.text();
    
    // Will return 400 for order not found
    assertEquals(response.status, 400);
  }
});
