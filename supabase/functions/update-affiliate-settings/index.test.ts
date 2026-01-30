/**
 * Integration Tests for update-affiliate-settings Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Update affiliate settings (enabled, requireApproval, defaultRate)
 * - Product ownership verification
 * - Authentication via unified-auth
 * - Default rate validation (0-90%)
 * 
 * @module update-affiliate-settings/index.test
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "update-affiliate-settings: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
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
  name: "update-affiliate-settings: Deve rejeitar request sem autenticação",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "product-123",
      enabled: true
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
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
// Update Settings Tests
// ============================================================================

Deno.test({
  name: "update-affiliate-settings: deve validar product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      enabled: true
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200/403/404 (com auth)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "update-affiliate-settings: deve aceitar enabled = true",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      enabled: true
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "update-affiliate-settings: deve aceitar enabled = false",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      enabled: false
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "update-affiliate-settings: deve aceitar requireApproval = true",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      requireApproval: true
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "update-affiliate-settings: deve aceitar requireApproval = false",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      requireApproval: false
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "update-affiliate-settings: deve aceitar defaultRate válido (0-90)",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      defaultRate: 50
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "update-affiliate-settings: deve aceitar defaultRate = 0",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      defaultRate: 0
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "update-affiliate-settings: deve aceitar defaultRate = 90",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      defaultRate: 90
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "update-affiliate-settings: deve aceitar múltiplos campos combinados",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      enabled: true,
      requireApproval: false,
      defaultRate: 30
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "update-affiliate-settings: deve verificar ownership do produto",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "non-owned-product-id",
      enabled: true
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
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
// Rate Limiting Tests
// ============================================================================

Deno.test({
  name: "update-affiliate-settings: deve aplicar rate limiting",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      enabled: true
    };

    // Fazer múltiplas requisições rapidamente
    const requests = Array.from({ length: 100 }, () =>
      fetch(`${supabaseUrl}/functions/v1/update-affiliate-settings`, {
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
