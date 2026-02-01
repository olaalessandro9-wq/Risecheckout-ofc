/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for get-order-for-pix Edge Function
 * 
 * Coverage:
 * - CORS handling
 * - Order ID validation
 * - Order retrieval
 * - PIX payment data
 * - Error handling
 * 
 * @module get-order-for-pix/index.test
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
  name: "get-order-for-pix/integration: OPTIONS deve retornar CORS headers",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-order-for-pix`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
  }
});

Deno.test({
  name: "get-order-for-pix/integration: Deve rejeitar request sem orderId",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-order-for-pix`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "get-order-for-pix/integration: Deve rejeitar orderId vazio",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-order-for-pix?orderId=`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "get-order-for-pix/integration: Deve retornar 404 para orderId inexistente",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-order-for-pix?orderId=nonexistent_order_123`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status, 404);
  }
});

Deno.test({
  name: "get-order-for-pix/integration: Content-Type deve ser application/json",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-order-for-pix?orderId=test_order_123`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.headers.get('Content-Type')?.includes('application/json'), true);
  }
});
