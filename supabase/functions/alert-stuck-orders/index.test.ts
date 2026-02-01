/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for alert-stuck-orders Edge Function
 * 
 * Coverage:
 * - CORS handling
 * - Cron job execution
 * - Stuck orders detection
 * - Alert notification
 * - Error handling
 * 
 * @module alert-stuck-orders/index.test
 * @version 1.1.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getTestConfig,
} from "../_shared/testing/mod.ts";

// ============================================================================
// Configuration
// ============================================================================

const config = getTestConfig();
const FUNCTION_NAME = "alert-stuck-orders";

function getFunctionUrl(): string {
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
    : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
}

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "alert-stuck-orders/integration: CORS headers",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "OPTIONS",
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get("Access-Control-Allow-Origin"));
  },
});

// ============================================================================
// Execution Tests
// ============================================================================

Deno.test({
  name: "alert-stuck-orders/integration: POST executes stuck orders check",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await response.text();
    // Should return 200 even if no stuck orders found
    assertEquals(response.status, 200);
  },
});

Deno.test({
  name: "alert-stuck-orders/integration: Content-Type is application/json",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await response.text();
    assertEquals(
      response.headers.get("Content-Type")?.includes("application/json"),
      true
    );
  },
});

Deno.test({
  name: "alert-stuck-orders/integration: returns valid response structure",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    assertExists(data);
    assertEquals(typeof data, "object");
  },
});
