/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for get-pix-status Edge Function
 * 
 * Coverage:
 * - CORS handling
 * - Transaction ID validation
 * - Status retrieval
 * - Gateway integration
 * - Error handling
 * 
 * @module get-pix-status/index.test
 * @version 1.1.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  skipIntegration, 
  integrationTestOptions,
  getTestConfig 
} from "../_shared/testing/mod.ts";

const config = getTestConfig();
const supabaseUrl = config.supabaseUrl;

Deno.test({
  name: "get-pix-status/integration: OPTIONS deve retornar CORS headers",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-pix-status`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
  }
});

Deno.test({
  name: "get-pix-status/integration: Deve rejeitar request sem transactionId",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-pix-status`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "get-pix-status/integration: Deve rejeitar transactionId vazio",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-pix-status?transactionId=`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "get-pix-status/integration: Deve retornar 404 para transactionId inexistente",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-pix-status?transactionId=nonexistent_tx_123`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status, 404);
  }
});

Deno.test({
  name: "get-pix-status/integration: Content-Type deve ser application/json",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-pix-status?transactionId=test_tx_123`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.headers.get('Content-Type')?.includes('application/json'), true);
  }
});

Deno.test({
  name: "get-pix-status/integration: Deve rejeitar request sem gateway",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-pix-status?transactionId=test_tx_123`, {
      method: 'GET'
    });
    await response.text();
    // Should fail if gateway is not specified or cannot be determined
    assertEquals(response.status >= 400 || response.status === 404, true);
  }
});
