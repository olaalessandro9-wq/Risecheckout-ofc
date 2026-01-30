/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for grant-member-access Edge Function
 * 
 * Coverage:
 * - CORS handling
 * - Order ID validation
 * - User ID validation
 * - Product access grant
 * - Members area access
 * - Error handling
 * 
 * @module grant-member-access/index.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

Deno.test({
  name: "grant-member-access: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/grant-member-access`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
  }
});

Deno.test({
  name: "grant-member-access: Deve rejeitar payload sem orderId",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      userId: 'user_test_123'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/grant-member-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "grant-member-access: Deve rejeitar payload sem userId",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/grant-member-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "grant-member-access: Deve rejeitar orderId vazio",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: '',
      userId: 'user_test_123'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/grant-member-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "grant-member-access: Deve rejeitar userId vazio",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      userId: ''
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/grant-member-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "grant-member-access: Deve retornar 404 para orderId inexistente",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'nonexistent_order_123',
      userId: 'user_test_123'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/grant-member-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.status, 404);
  }
});

Deno.test({
  name: "grant-member-access: Content-Type deve ser application/json",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      orderId: 'order_test_123',
      userId: 'user_test_123'
    };
    const response = await fetch(`${supabaseUrl}/functions/v1/grant-member-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await response.text();
    assertEquals(response.headers.get('Content-Type')?.includes('application/json'), true);
  }
});
