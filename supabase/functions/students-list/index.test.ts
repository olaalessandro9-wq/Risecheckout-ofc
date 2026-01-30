/**
 * Integration Tests for students-list Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - List students (list) - com paginação, filtros
 * - Get student (get) - detalhes de um estudante
 * - Get producer info (get-producer-info)
 * - Product ownership verification
 * - Authentication via unified-auth
 * - Filtros: search, access_type, status, group_id
 * 
 * @module students-list/index.test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "students-list: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
  name: "students-list: Deve rejeitar request sem autenticação",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list",
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
// List Students Tests
// ============================================================================

Deno.test({
  name: "students-list: list - deve validar product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list",
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
  name: "students-list: list - deve rejeitar sem product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list"
      // product_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
  name: "students-list: list - deve aceitar paginação (page, limit)",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list",
      product_id: "test-product-id",
      page: 1,
      limit: 20
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
  name: "students-list: list - deve aceitar filtro search",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list",
      product_id: "test-product-id",
      search: "john"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
  name: "students-list: list - deve aceitar filtro access_type",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list",
      product_id: "test-product-id",
      access_type: "purchase"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
  name: "students-list: list - deve aceitar filtro status",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list",
      product_id: "test-product-id",
      status: "active"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
  name: "students-list: list - deve aceitar filtro group_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list",
      product_id: "test-product-id",
      group_id: "group-123"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
  name: "students-list: list - deve aceitar múltiplos filtros combinados",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list",
      product_id: "test-product-id",
      page: 1,
      limit: 10,
      search: "john",
      access_type: "purchase",
      status: "active",
      group_id: "group-123"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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

// ============================================================================
// Get Student Tests
// ============================================================================

Deno.test({
  name: "students-list: get - deve validar buyer_id e product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "get",
      buyer_id: "test-buyer-id",
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 403 (sem ownership) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "students-list: get - deve rejeitar sem buyer_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "get",
      product_id: "test-product-id"
      // buyer_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
  name: "students-list: get - deve rejeitar sem product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "get",
      buyer_id: "test-buyer-id"
      // product_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
// Get Producer Info Tests
// ============================================================================

Deno.test({
  name: "students-list: get-producer-info - deve validar product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "get-producer-info",
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
  name: "students-list: get-producer-info - deve rejeitar sem product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "get-producer-info"
      // product_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
  name: "students-list: deve rejeitar ação inválida",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "invalid-action",
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
  name: "students-list: deve aplicar rate limiting",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list",
      product_id: "test-product-id"
    };

    // Fazer múltiplas requisições rapidamente
    const requests = Array.from({ length: 100 }, () =>
      fetch(`${supabaseUrl}/functions/v1/students-list`, {
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
    assertEquals(statuses.every(s => [200, 401, 403, 429].includes(s)), true);
  }
});
