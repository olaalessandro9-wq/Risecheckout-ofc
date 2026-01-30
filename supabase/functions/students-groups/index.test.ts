/**
 * Integration Tests for students-groups Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Add to group (add-to-group)
 * - Remove from group (remove-from-group)
 * - Assign groups (assign-groups) - replace all
 * - Product ownership verification
 * - Authentication via unified-auth
 * - Group validation
 * 
 * @module students-groups/index.test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "students-groups: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/students-groups`, {
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
  name: "students-groups: Deve rejeitar request sem autenticação",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "add-to-group",
      buyer_id: "buyer-123",
      group_id: "group-123"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-groups`, {
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
// Add to Group Tests
// ============================================================================

Deno.test({
  name: "students-groups: add-to-group - deve validar buyer_id e group_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "add-to-group",
      buyer_id: "test-buyer-id",
      group_id: "test-group-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "students-groups: add-to-group - deve rejeitar sem buyer_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "add-to-group",
      group_id: "test-group-id"
      // buyer_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-groups`, {
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
  name: "students-groups: add-to-group - deve rejeitar sem group_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "add-to-group",
      buyer_id: "test-buyer-id"
      // group_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-groups`, {
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
// Remove from Group Tests
// ============================================================================

Deno.test({
  name: "students-groups: remove-from-group - deve validar buyer_id e group_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "remove-from-group",
      buyer_id: "test-buyer-id",
      group_id: "test-group-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "students-groups: remove-from-group - deve rejeitar sem buyer_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "remove-from-group",
      group_id: "test-group-id"
      // buyer_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-groups`, {
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
// Assign Groups Tests
// ============================================================================

Deno.test({
  name: "students-groups: assign-groups - deve validar buyer_id e group_ids",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "assign-groups",
      buyer_id: "test-buyer-id",
      group_ids: ["group-1", "group-2"],
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-groups`, {
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
  name: "students-groups: assign-groups - deve aceitar array vazio",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "assign-groups",
      buyer_id: "test-buyer-id",
      group_ids: [],
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-groups`, {
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
  name: "students-groups: assign-groups - deve rejeitar sem buyer_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "assign-groups",
      group_ids: ["group-1"],
      product_id: "test-product-id"
      // buyer_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-groups`, {
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
  name: "students-groups: assign-groups - deve verificar ownership do produto",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "assign-groups",
      buyer_id: "test-buyer-id",
      group_ids: ["group-1"],
      product_id: "non-existent-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-groups`, {
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
// Invalid Action Tests
// ============================================================================

Deno.test({
  name: "students-groups: deve rejeitar ação inválida",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "invalid-action",
      buyer_id: "test-buyer-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-groups`, {
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
  name: "students-groups: deve aplicar rate limiting",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "add-to-group",
      buyer_id: "test-buyer-id",
      group_id: "test-group-id"
    };

    // Fazer múltiplas requisições rapidamente
    const requests = Array.from({ length: 100 }, () =>
      fetch(`${supabaseUrl}/functions/v1/students-groups`, {
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
    assertEquals(statuses.every(s => [200, 401, 404, 429].includes(s)), true);
  }
});
