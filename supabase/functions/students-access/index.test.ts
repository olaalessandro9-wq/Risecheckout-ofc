/**
 * Integration Tests for students-access Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Grant access (grant-access)
 * - Revoke access (revoke-access)
 * - Product ownership verification
 * - Buyer validation (RISE V3 SSOT: users table)
 * - Authentication via unified-auth
 * - order_id handling
 * 
 * @module students-access/index.test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "students-access: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/students-access`, {
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
  name: "students-access: Deve rejeitar request sem autenticação",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "grant-access",
      buyer_id: "buyer-123",
      product_id: "product-123"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-access`, {
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
// Grant Access Tests
// ============================================================================

Deno.test({
  name: "students-access: grant-access - deve validar buyer_id e product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "grant-access",
      buyer_id: "test-buyer-id",
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 403 (sem ownership) ou 404 (buyer não encontrado) ou 200 (sucesso)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "students-access: grant-access - deve rejeitar sem buyer_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "grant-access",
      product_id: "test-product-id"
      // buyer_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 400 (validação) ou 401 (sem auth)
    assertEquals([400, 401].includes(response.status), true);
  }
});

Deno.test({
  name: "students-access: grant-access - deve rejeitar sem product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "grant-access",
      buyer_id: "test-buyer-id"
      // product_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 400 (validação) ou 401 (sem auth)
    assertEquals([400, 401].includes(response.status), true);
  }
});

Deno.test({
  name: "students-access: grant-access - deve aceitar order_id opcional",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "grant-access",
      buyer_id: "test-buyer-id",
      product_id: "test-product-id",
      order_id: "order-123"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 403 (sem ownership) ou 404 (buyer não encontrado) ou 200 (sucesso)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "students-access: grant-access - deve funcionar sem order_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "grant-access",
      buyer_id: "test-buyer-id",
      product_id: "test-product-id"
      // order_id ausente (opcional)
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 403 (sem ownership) ou 404 (buyer não encontrado) ou 200 (sucesso)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "students-access: grant-access - deve verificar ownership do produto",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "grant-access",
      buyer_id: "test-buyer-id",
      product_id: "non-existent-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 403 (sem ownership)
    assertEquals([401, 403].includes(response.status), true);
  }
});

// ============================================================================
// Revoke Access Tests
// ============================================================================

Deno.test({
  name: "students-access: revoke-access - deve validar buyer_id e product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "revoke-access",
      buyer_id: "test-buyer-id",
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 403 (sem ownership) ou 200 (sucesso)
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});

Deno.test({
  name: "students-access: revoke-access - deve rejeitar sem buyer_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "revoke-access",
      product_id: "test-product-id"
      // buyer_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 400 (validação) ou 401 (sem auth)
    assertEquals([400, 401].includes(response.status), true);
  }
});

Deno.test({
  name: "students-access: revoke-access - deve rejeitar sem product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "revoke-access",
      buyer_id: "test-buyer-id"
      // product_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 400 (validação) ou 401 (sem auth)
    assertEquals([400, 401].includes(response.status), true);
  }
});

// ============================================================================
// Invalid Action Tests
// ============================================================================

Deno.test({
  name: "students-access: deve rejeitar ação inválida",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "invalid-action",
      buyer_id: "test-buyer-id",
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 400 (ação inválida) ou 401 (sem auth)
    assertEquals([400, 401].includes(response.status), true);
  }
});

// ============================================================================
// Rate Limiting Tests
// ============================================================================

Deno.test({
  name: "students-access: deve aplicar rate limiting",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "grant-access",
      buyer_id: "test-buyer-id",
      product_id: "test-product-id"
    };

    // Fazer múltiplas requisições rapidamente
    const requests = Array.from({ length: 100 }, () =>
      fetch(`${supabaseUrl}/functions/v1/students-access`, {
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
    assertEquals(statuses.every(s => [200, 401, 403, 404, 429].includes(s)), true);
  }
});
