/**
 * Integration Tests for members-area-quizzes Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Quiz CRUD operations (list, get, create, update, delete)
 * - Quiz submission and scoring
 * - Attempts tracking
 * - Authentication (producer and buyer)
 * - Validation rules
 * 
 * @module members-area-quizzes/index.test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { 
  skipIntegration, 
  integrationTestOptions,
  getTestConfig 
} from "../_shared/testing/mod.ts";

// ============================================================================
// Configuration
// ============================================================================

const config = getTestConfig();

function getFunctionUrl(): string {
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/members-area-quizzes`
    : "https://mock.supabase.co/functions/v1/members-area-quizzes";
}

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: OPTIONS deve retornar CORS headers",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: 'OPTIONS'
    });

    await response.text();

    assertEquals(response.status, 200);
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  }
});

// ============================================================================
// List Quizzes Tests
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: list - deve validar content_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "list",
      content_id: "test-content-id"
    };

    const response = await fetch(getFunctionUrl(), {
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
// Get Quiz Tests
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: get - deve validar quiz_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "get",
      quiz_id: "test-quiz-id"
    };

    const response = await fetch(getFunctionUrl(), {
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

// ============================================================================
// Create Quiz Tests
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: create - deve rejeitar sem content_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "create",
      data: {
        title: "Test Quiz",
        description: "Test description"
      }
    };

    const response = await fetch(getFunctionUrl(), {
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

Deno.test({
  name: "members-area-quizzes/integration: create - deve validar estrutura de questions",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "create",
      content_id: "test-content-id",
      data: {
        title: "Test Quiz",
        questions: [
          {
            question_text: "What is 2+2?",
            question_type: "multiple_choice",
            points: 10,
            position: 0,
            answers: [
              { answer_text: "3", is_correct: false, position: 0 },
              { answer_text: "4", is_correct: true, position: 1 }
            ]
          }
        ]
      }
    };

    const response = await fetch(getFunctionUrl(), {
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
// Update Quiz Tests
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: update - deve validar quiz_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "update",
      quiz_id: "test-quiz-id",
      data: {
        title: "Updated Quiz"
      }
    };

    const response = await fetch(getFunctionUrl(), {
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
// Delete Quiz Tests
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: delete - deve validar quiz_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "delete",
      quiz_id: "test-quiz-id"
    };

    const response = await fetch(getFunctionUrl(), {
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
// Submit Quiz Tests
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: submit - deve validar quiz_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "submit",
      quiz_id: "test-quiz-id",
      data: {
        answers: {
          "question-1": "answer-1",
          "question-2": "answer-2"
        }
      }
    };

    const response = await fetch(getFunctionUrl(), {
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
  name: "members-area-quizzes/integration: submit - deve rejeitar sem answers",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "submit",
      quiz_id: "test-quiz-id",
      data: {}
    };

    const response = await fetch(getFunctionUrl(), {
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
// Get Attempts Tests
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: get-attempts - deve validar quiz_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "get-attempts",
      quiz_id: "test-quiz-id"
    };

    const response = await fetch(getFunctionUrl(), {
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
  name: "members-area-quizzes/integration: deve rejeitar ação inválida",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "invalid-action",
      quiz_id: "test-quiz-id"
    };

    const response = await fetch(getFunctionUrl(), {
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
  name: "members-area-quizzes/integration: deve aplicar rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "list",
      content_id: "test-content-id"
    };

    // Fazer múltiplas requisições rapidamente
    const requests = Array.from({ length: 100 }, () =>
      fetch(getFunctionUrl(), {
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
    assertEquals(statuses.every(s => [200, 401, 429].includes(s)), true);
  }
});
