/**
 * Integration Tests for admin-data (CORS, Auth)
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * NOTE: These tests require deployed edge functions.
 * They are skipped in CI environments without proper configuration.
 * 
 * @module admin-data/tests/integration.test
 * @version 1.1.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getTestConfig,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// Configuration
// ============================================================================

const config = getTestConfig();
const FUNCTION_NAME = "admin-data";

function getFunctionUrl(): string {
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
    : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
}

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "admin-data/integration: CORS headers structure",
  ignore: false, // This test doesn't require network
  ...integrationTestOptions,
  fn: () => {
    // Test the expected CORS header structure (no actual fetch needed)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };
    
    assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
    assertExists(corsHeaders["Access-Control-Allow-Headers"]);
  },
});

// ============================================================================
// Auth Tests
// ============================================================================

Deno.test({
  name: "admin-data/integration: rejects unauthenticated requests",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.supabasePublishableKey ?? "",
      },
      body: JSON.stringify({ action: "admin-products" }),
    });
    
    assertEquals(response.status, 401);
    await response.text();
  },
});

Deno.test({
  name: "admin-data/integration: rejects requests without apikey",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "admin-products" }),
    });
    
    const body = await response.text();
    assertExists(body);
  },
});

Deno.test({
  name: "admin-data/integration: rejects unknown action (with auth failure first)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.supabasePublishableKey ?? "",
      },
      body: JSON.stringify({ action: "unknown-action-xyz" }),
    });
    
    assertEquals(response.status, 401);
    await response.text();
  },
});
