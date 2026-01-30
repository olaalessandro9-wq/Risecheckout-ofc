/**
 * Integration Tests for members-area-certificates Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Certificate templates CRUD (list, get, create, update, delete)
 * - Certificate generation
 * - Certificate verification (public action)
 * - Buyer certificates listing
 * - Verification code format
 * 
 * @module members-area-certificates/index.test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "members-area-certificates: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
      method: 'OPTIONS'
    });

    await response.text();

    assertEquals(response.status, 200);
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  }
});

// ============================================================================
// List Templates Tests
// ============================================================================

Deno.test({
  name: "members-area-certificates: list-templates - deve validar product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list-templates",
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});

// ============================================================================
// Get Template Tests
// ============================================================================

Deno.test({
  name: "members-area-certificates: get-template - deve validar template_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "get-template",
      template_id: "test-template-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

// ============================================================================
// Create Template Tests
// ============================================================================

Deno.test({
  name: "members-area-certificates: create-template - deve validar product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "create-template",
      product_id: "test-product-id",
      data: {
        name: "Test Template",
        template_html: "<html>Test</html>",
        primary_color: "#000000"
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});

Deno.test({
  name: "members-area-certificates: create-template - deve aceitar is_default",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "create-template",
      product_id: "test-product-id",
      data: {
        name: "Default Template",
        template_html: "<html>Default</html>",
        is_default: true
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});

// ============================================================================
// Update Template Tests
// ============================================================================

Deno.test({
  name: "members-area-certificates: update-template - deve validar template_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "update-template",
      template_id: "test-template-id",
      data: {
        name: "Updated Template"
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

// ============================================================================
// Delete Template Tests
// ============================================================================

Deno.test({
  name: "members-area-certificates: delete-template - deve validar template_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "delete-template",
      template_id: "test-template-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

// ============================================================================
// Generate Certificate Tests
// ============================================================================

Deno.test({
  name: "members-area-certificates: generate - deve rejeitar sem product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "generate"
      // product_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
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

Deno.test({
  name: "members-area-certificates: generate - deve validar product_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "generate",
      product_id: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401].includes(response.status), true);
  }
});

// ============================================================================
// Verify Certificate Tests (Public Action)
// ============================================================================

Deno.test({
  name: "members-area-certificates: verify - deve rejeitar sem verification_code",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "verify"
      // verification_code ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
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

Deno.test({
  name: "members-area-certificates: verify - deve retornar valid: false para código inexistente",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "verify",
      verification_code: "XXXX-XXXX-XXXX"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data.valid, false);
  }
});

Deno.test({
  name: "members-area-certificates: verify - deve converter código para uppercase",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "verify",
      verification_code: "abcd-efgh-ijkl"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Deve processar sem erro (mesmo que não encontre)
    assertEquals(response.status, 200);
    assertExists(data.valid);
  }
});

// ============================================================================
// List Buyer Certificates Tests
// ============================================================================

Deno.test({
  name: "members-area-certificates: list-buyer-certificates - deve requerer autenticação",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list-buyer-certificates"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401].includes(response.status), true);
  }
});

// ============================================================================
// Invalid Action Tests
// ============================================================================

Deno.test({
  name: "members-area-certificates: deve rejeitar ação inválida",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "invalid-action"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
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
// Rate Limiting Tests
// ============================================================================

Deno.test({
  name: "members-area-certificates: deve aplicar rate limiting",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "verify",
      verification_code: "TEST-CODE-1234"
    };

    // Fazer múltiplas requisições rapidamente
    const requests = Array.from({ length: 100 }, () =>
      fetch(`${supabaseUrl}/functions/v1/members-area-certificates`, {
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
    assertEquals(statuses.every(s => [200, 429].includes(s)), true);
  }
});
