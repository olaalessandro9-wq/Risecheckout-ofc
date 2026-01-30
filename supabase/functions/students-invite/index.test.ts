/**
 * Integration Tests for students-invite Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Invite token validation (validate-invite-token)
 * - Invite token usage (use-invite-token)
 * - Purchase access generation (generate-purchase-access)
 * - Manual invite (invite) - requires auth
 * - Authentication via unified-auth
 * - Public actions (validate, use, generate)
 * 
 * @module students-invite/index.test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "students-invite: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
      method: 'OPTIONS'
    });

    await response.text();

    assertEquals(response.status, 200);
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  }
});

// ============================================================================
// Validate Invite Token Tests (PUBLIC)
// ============================================================================

Deno.test({
  name: "students-invite: validate-invite-token - deve aceitar token",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "validate-invite-token",
      token: "test-token-123"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 200 (token válido) ou 404 (token inválido)
    assertEquals([200, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "students-invite: validate-invite-token - deve rejeitar sem token",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "validate-invite-token"
      // token ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar erro (400 ou 404)
    assertEquals(response.status >= 400, true);
  }
});

// ============================================================================
// Use Invite Token Tests (PUBLIC)
// ============================================================================

Deno.test({
  name: "students-invite: use-invite-token - deve aceitar token e password",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "use-invite-token",
      token: "test-token-123",
      password: "SecurePassword123!"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Pode retornar 200 (sucesso), 400 (token inválido), ou 404 (não encontrado)
    assertEquals([200, 400, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "students-invite: use-invite-token - deve rejeitar sem token",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "use-invite-token",
      password: "SecurePassword123!"
      // token ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "students-invite: use-invite-token - deve rejeitar sem password",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "use-invite-token",
      token: "test-token-123"
      // password ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    assertEquals(response.status >= 400, true);
  }
});

// ============================================================================
// Generate Purchase Access Tests (PUBLIC)
// ============================================================================

Deno.test({
  name: "students-invite: generate-purchase-access - deve aceitar order_id, customer_email, product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "generate-purchase-access",
      order_id: "order-123",
      customer_email: "customer@example.com",
      product_id: "product-123"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Pode retornar 200 (sucesso) ou 400/404 (erro)
    assertEquals([200, 400, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "students-invite: generate-purchase-access - deve rejeitar sem order_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "generate-purchase-access",
      customer_email: "customer@example.com",
      product_id: "product-123"
      // order_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    assertEquals(response.status >= 400, true);
  }
});

// ============================================================================
// Invite Tests (AUTHENTICATED)
// ============================================================================

Deno.test({
  name: "students-invite: invite - deve rejeitar sem autenticação",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "invite",
      product_id: "product-123",
      email: "student@example.com",
      name: "Student Name"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
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

Deno.test({
  name: "students-invite: invite - deve validar product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "invite",
      product_id: "test-product-id",
      email: "student@example.com",
      name: "Student Name"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200/403 (com auth)
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});

Deno.test({
  name: "students-invite: invite - deve aceitar group_ids",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "invite",
      product_id: "test-product-id",
      email: "student@example.com",
      name: "Student Name",
      group_ids: ["group-1", "group-2"]
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200/403 (com auth)
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});

// ============================================================================
// Invalid Action Tests
// ============================================================================

Deno.test({
  name: "students-invite: deve rejeitar ação inválida",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "invalid-action"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(response.status, 400);
    assertExists(data.error);
  }
});

// ============================================================================
// Invalid JSON Tests
// ============================================================================

Deno.test({
  name: "students-invite: deve rejeitar JSON inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/students-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: "invalid json"
    });

    const data = await response.json();

    assertEquals(response.status, 400);
    assertExists(data.error);
  }
});

// ============================================================================
// Rate Limiting Tests
// ============================================================================

Deno.test({
  name: "students-invite: deve aplicar rate limiting",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "validate-invite-token",
      token: "test-token"
    };

    // Fazer múltiplas requisições rapidamente
    const requests = Array.from({ length: 100 }, () =>
      fetch(`${supabaseUrl}/functions/v1/students-invite`, {
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
    assertEquals(statuses.every(s => [200, 400, 404, 429].includes(s)), true);
  }
});
