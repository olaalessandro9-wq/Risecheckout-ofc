/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for pushinpay-get-status Edge Function
 * 
 * @module pushinpay-get-status/index.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

Deno.test({
  name: "pushinpay-get-status: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-get-status`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
  }
});

Deno.test({
  name: "pushinpay-get-status: Deve rejeitar request sem transactionId",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-get-status`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "pushinpay-get-status: Deve rejeitar transactionId vazio",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/pushinpay-get-status?transactionId=`, {
      method: 'GET'
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});
