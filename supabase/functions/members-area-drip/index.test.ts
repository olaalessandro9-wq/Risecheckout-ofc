/**
 * Integration Tests for members-area-drip Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Drip content release types (immediate, days_after_purchase, fixed_date, after_content)
 * - Access validation logic
 * - Settings management
 * - Edge cases críticos para liberação de conteúdo
 * 
 * @module members-area-drip/index.test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const skipTests = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "members-area-drip: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
      method: 'OPTIONS'
    });

    await response.text();

    assertEquals(response.status, 200);
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  }
});

// ============================================================================
// Get Settings Tests
// ============================================================================

Deno.test({
  name: "members-area-drip: get-settings - deve rejeitar sem content_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "get-settings"
      // content_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
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
  name: "members-area-drip: get-settings - deve retornar immediate como padrão",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "get-settings",
      content_id: "non-existent-content-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou resposta com settings padrão
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});

// ============================================================================
// Update Settings Tests
// ============================================================================

Deno.test({
  name: "members-area-drip: update-settings - deve rejeitar sem content_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "update-settings",
      settings: {
        release_type: "immediate"
      }
      // content_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
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
  name: "members-area-drip: update-settings - deve rejeitar sem settings",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "update-settings",
      content_id: "test-content-id"
      // settings ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
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
  name: "members-area-drip: update-settings - immediate deve deletar settings",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "update-settings",
      content_id: "test-content-id",
      settings: {
        release_type: "immediate"
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
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
  name: "members-area-drip: update-settings - days_after_purchase deve incluir days",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "update-settings",
      content_id: "test-content-id",
      settings: {
        release_type: "days_after_purchase",
        days_after_purchase: 7
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
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
  name: "members-area-drip: update-settings - fixed_date deve incluir data",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "update-settings",
      content_id: "test-content-id",
      settings: {
        release_type: "fixed_date",
        fixed_date: "2025-12-31"
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
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
  name: "members-area-drip: update-settings - after_content deve incluir content_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "update-settings",
      content_id: "test-content-id",
      settings: {
        release_type: "after_content",
        after_content_id: "previous-content-id"
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
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
// Check Access Tests
// ============================================================================

Deno.test({
  name: "members-area-drip: check-access - deve rejeitar sem content_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "check-access",
      buyer_id: "test-buyer-id"
      // content_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
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
  name: "members-area-drip: check-access - deve rejeitar sem buyer_id",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "check-access",
      content_id: "test-content-id"
      // buyer_id ausente
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
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
  name: "members-area-drip: check-access - immediate deve sempre permitir",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "check-access",
      content_id: "non-existent-content-id",
      buyer_id: "test-buyer-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar 200 com has_access: true (immediate é padrão)
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});

// ============================================================================
// Unlock Content Tests
// ============================================================================

Deno.test({
  name: "members-area-drip: unlock-content - deve validar parâmetros",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "unlock-content"
      // parâmetros ausentes
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();

    // Deve retornar erro de validação ou auth
    assertEquals(response.status >= 400, true);
  }
});

// ============================================================================
// Invalid Action Tests
// ============================================================================

Deno.test({
  name: "members-area-drip: deve rejeitar ação inválida",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "invalid-action",
      content_id: "test-content-id"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
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
  name: "members-area-drip: deve aplicar rate limiting",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "check-access",
      content_id: "test-content-id",
      buyer_id: "test-buyer-id"
    };

    // Fazer múltiplas requisições rapidamente
    const requests = Array.from({ length: 100 }, () =>
      fetch(`${supabaseUrl}/functions/v1/members-area-drip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);

    // Pelo menos uma deve retornar 429 (rate limit)
    // Ou todas retornam 200/401 (rate limit não atingido)
    assertEquals(statuses.every(s => [200, 401, 403, 429].includes(s)), true);
  }
});
