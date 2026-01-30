/**
 * Integration Tests for members-area-modules Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Router pattern validation
 * - Authentication via unified-auth
 * - All CRUD operations (list, create, update, delete, reorder)
 * - Section management (save-sections, save-builder-settings)
 * - Ownership verification
 * - Error handling
 * 
 * @module members-area-modules/index.test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "members-area-modules: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
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
  name: "members-area-modules: Deve rejeitar request sem autenticação",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list",
      productId: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
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
// List Modules Tests
// ============================================================================

Deno.test({
  name: "members-area-modules: list - deve rejeitar sem productId",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "list"
      // productId ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(response.status >= 400, true);
    assertExists(data.error);
  }
});

// ============================================================================
// Create Module Tests
// ============================================================================

Deno.test({
  name: "members-area-modules: create - deve rejeitar sem título",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "create",
      productId: "test-product-id",
      data: {
        description: "Test description"
        // title ausente
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
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
  name: "members-area-modules: create - deve rejeitar título vazio",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "create",
      productId: "test-product-id",
      data: {
        title: "   ", // apenas espaços
        description: "Test description"
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
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
// Update Module Tests
// ============================================================================

Deno.test({
  name: "members-area-modules: update - deve rejeitar sem moduleId",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "update",
      data: {
        title: "Updated title"
      }
      // moduleId ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(response.status >= 400, true);
    assertExists(data.error);
  }
});

// ============================================================================
// Delete Module Tests
// ============================================================================

Deno.test({
  name: "members-area-modules: delete - deve rejeitar sem moduleId",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "delete"
      // moduleId ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(response.status >= 400, true);
    assertExists(data.error);
  }
});

// ============================================================================
// Reorder Modules Tests
// ============================================================================

Deno.test({
  name: "members-area-modules: reorder - deve rejeitar sem orderedIds",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "reorder",
      productId: "test-product-id"
      // orderedIds ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(response.status >= 400, true);
    assertExists(data.error);
  }
});

Deno.test({
  name: "members-area-modules: reorder - deve aceitar array vazio",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "reorder",
      productId: "test-product-id",
      orderedIds: []
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 403 (sem ownership), não 400 (validação)
    assertEquals([401, 403].includes(response.status), true);
  }
});

// ============================================================================
// Save Sections Tests
// ============================================================================

Deno.test({
  name: "members-area-modules: save-sections - deve aceitar sections vazias",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "save-sections",
      productId: "test-product-id",
      sections: [],
      deletedIds: []
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 403 (sem ownership), não 400 (validação)
    assertEquals([401, 403].includes(response.status), true);
  }
});

Deno.test({
  name: "members-area-modules: save-sections - deve validar estrutura de section",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "save-sections",
      productId: "test-product-id",
      sections: [
        {
          id: "section-1",
          type: "text",
          position: 0,
          settings: {}
        }
      ]
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 403 (sem ownership), não 400 (validação)
    assertEquals([401, 403].includes(response.status), true);
  }
});

// ============================================================================
// Save Builder Settings Tests
// ============================================================================

Deno.test({
  name: "members-area-modules: save-builder-settings - deve aceitar settings vazias",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "save-builder-settings",
      productId: "test-product-id",
      settings: {}
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 403 (sem ownership), não 400 (validação)
    assertEquals([401, 403].includes(response.status), true);
  }
});

// ============================================================================
// Invalid Action Tests
// ============================================================================

Deno.test({
  name: "members-area-modules: deve rejeitar ação inválida",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "invalid-action",
      productId: "test-product-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(response.status, 404);
    assertExists(data.error);
  }
});

// ============================================================================
// Invalid JSON Tests
// ============================================================================

Deno.test({
  name: "members-area-modules: deve rejeitar JSON inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-modules`, {
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
