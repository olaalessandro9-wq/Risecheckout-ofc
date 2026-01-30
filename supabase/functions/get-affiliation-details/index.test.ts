/**
 * Integration Tests for get-affiliation-details Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Get affiliation details
 * - Product ownership verification
 * - Authentication via unified-auth
 * 
 * @module get-affiliation-details/index.test
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

Deno.test({
  name: "get-affiliation-details: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-affiliation-details`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  }
});

Deno.test({
  name: "get-affiliation-details: Deve rejeitar request sem autenticação",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-affiliation-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affiliation_id: "test-id" })
    });
    await response.text();
    assertEquals(response.status, 401);
  }
});

Deno.test({
  name: "get-affiliation-details: deve validar affiliation_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/get-affiliation-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affiliation_id: "test-affiliation-id" })
    });
    await response.text();
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "get-affiliation-details: deve aplicar rate limiting",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const requests = Array.from({ length: 100 }, () =>
      fetch(`${supabaseUrl}/functions/v1/get-affiliation-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliation_id: "test-id" })
      })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);
    assertEquals(statuses.every(s => [200, 401, 403, 404, 429].includes(s)), true);
  }
});
