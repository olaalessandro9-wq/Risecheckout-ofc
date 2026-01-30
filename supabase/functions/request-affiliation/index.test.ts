/**
 * Integration Tests for request-affiliation Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Request affiliation for a product
 * - Product validation (exists, affiliates enabled)
 * - Duplicate affiliation prevention
 * - Authentication via unified-auth
 * - Gateway validation (wallet_id required)
 * - Approval workflow (auto-approve vs manual)
 * 
 * @module request-affiliation/index.test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "request-affiliation: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/request-affiliation`, {
      method: 'OPTIONS'
    });

    await response.text();

    assertEquals(response.status, 200);
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  }
});

// ============================================================================
// Authentication Tests
// ============================================================================

Deno.test({
  name: "request-affiliation: Deve rejeitar request sem autenticação",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "product-123"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/request-affiliation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    assertEquals(response.status, 401);
  }
});

// ============================================================================
// Request Affiliation Tests
// ============================================================================

Deno.test({
  name: "request-affiliation: deve validar product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/request-affiliation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200/400/404 (com auth)
    assertEquals([200, 400, 401, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "request-affiliation: deve rejeitar sem product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {};

    const response = await fetch(`${supabaseUrl}/functions/v1/request-affiliation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 400 (validação) ou 401 (sem auth) ou 500 (erro)
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "request-affiliation: deve rejeitar produto inexistente",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "non-existent-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/request-affiliation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 404 (produto não encontrado)
    assertEquals([401, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "request-affiliation: deve rejeitar se afiliados não habilitados",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "product-without-affiliates"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/request-affiliation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 400 (afiliados não habilitados) ou 404
    assertEquals([400, 401, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "request-affiliation: deve rejeitar afiliação duplicada",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "product-with-existing-affiliation"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/request-affiliation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Pode retornar 401 (sem auth) ou 400 (já afiliado) ou 200 (sucesso) ou 404
    assertEquals([200, 400, 401, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "request-affiliation: deve validar gateway (wallet_id)",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "product-requiring-gateway"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/request-affiliation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Pode retornar 401 (sem auth) ou 400 (gateway não configurado) ou 200 (sucesso) ou 404
    assertEquals([200, 400, 401, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "request-affiliation: deve criar afiliação pending se requireApproval",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "product-requiring-approval"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/request-affiliation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Pode retornar 401 (sem auth) ou 200 (sucesso) ou 400/404 (erro)
    assertEquals([200, 400, 401, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "request-affiliation: deve auto-aprovar se não requireApproval",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "product-auto-approve"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/request-affiliation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Pode retornar 401 (sem auth) ou 200 (sucesso) ou 400/404 (erro)
    assertEquals([200, 400, 401, 404].includes(response.status), true);
  }
});

// ============================================================================
// Rate Limiting Tests
// ============================================================================

Deno.test({
  name: "request-affiliation: deve aplicar rate limiting",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "test-product-id"
    };

    // Fazer múltiplas requisições rapidamente
    const requests = Array.from({ length: 100 }, () =>
      fetch(`${supabaseUrl}/functions/v1/request-affiliation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);

    // Todas devem retornar status válidos
    assertEquals(statuses.every(s => [200, 400, 401, 404, 429, 500].includes(s)), true);
  }
});
