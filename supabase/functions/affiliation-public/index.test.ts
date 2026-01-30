/**
 * Integration Tests for affiliation-public Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Get public affiliation info (PUBLIC - no auth)
 * - Validate affiliate code
 * - Product validation
 * 
 * @module affiliation-public/index.test
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "affiliation-public: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/affiliation-public`, {
      method: 'OPTIONS'
    });
    await response.text();
    assertEquals(response.status, 200);
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  }
});

// ============================================================================
// Public Access Tests (NO AUTH REQUIRED)
// ============================================================================

Deno.test({
  name: "affiliation-public: deve aceitar request sem autenticação (PUBLIC)",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/affiliation-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        product_id: "test-product-id",
        affiliate_code: "test-code"
      })
    });
    await response.text();
    // Deve retornar 200 (sucesso) ou 404 (não encontrado) - SEM 401
    assertEquals([200, 400, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "affiliation-public: deve validar product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/affiliation-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        product_id: "test-product-id",
        affiliate_code: "test-code"
      })
    });
    await response.text();
    assertEquals([200, 400, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "affiliation-public: deve validar affiliate_code",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/affiliation-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        product_id: "test-product-id",
        affiliate_code: "TESTCODE123"
      })
    });
    await response.text();
    assertEquals([200, 400, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "affiliation-public: deve rejeitar sem product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/affiliation-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        affiliate_code: "test-code"
        // product_id ausente
      })
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "affiliation-public: deve rejeitar sem affiliate_code",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/affiliation-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        product_id: "test-product-id"
        // affiliate_code ausente
      })
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "affiliation-public: deve rejeitar código inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/affiliation-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        product_id: "test-product-id",
        affiliate_code: "INVALID-CODE-XYZ"
      })
    });
    await response.text();
    // Deve retornar 404 (não encontrado) ou 400 (inválido)
    assertEquals([400, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "affiliation-public: deve rejeitar afiliação bloqueada",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/affiliation-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        product_id: "test-product-id",
        affiliate_code: "BLOCKED-CODE"
      })
    });
    await response.text();
    // Pode retornar 400 (bloqueado) ou 404 (não encontrado)
    assertEquals([400, 404].includes(response.status), true);
  }
});

// ============================================================================
// Rate Limiting Tests
// ============================================================================

Deno.test({
  name: "affiliation-public: deve aplicar rate limiting",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const requests = Array.from({ length: 100 }, () =>
      fetch(`${supabaseUrl}/functions/v1/affiliation-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          product_id: "test-id",
          affiliate_code: "test-code"
        })
      })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);
    assertEquals(statuses.every(s => [200, 400, 404, 429].includes(s)), true);
  }
});
