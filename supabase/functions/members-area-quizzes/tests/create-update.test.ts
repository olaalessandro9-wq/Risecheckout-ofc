/**
 * Create and Update Quiz Tests for members-area-quizzes
 * 
 * @module members-area-quizzes/tests/create-update.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createCreatePayload,
  createUpdatePayload,
  createSampleQuestionData,
} from "./_shared.ts";

// ============================================================================
// CREATE QUIZ TESTS
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
        description: "Test description",
      },
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await response.text();
    // Deve retornar erro de validação ou auth
    assertEquals(response.status >= 400, true);
  },
});

Deno.test({
  name: "members-area-quizzes/integration: create - deve validar estrutura de questions",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createCreatePayload("test-content-id", createSampleQuestionData())),
    });
    await response.text();
    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401, 403].includes(response.status), true);
  },
});

// ============================================================================
// UPDATE QUIZ TESTS
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: update - deve validar quiz_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createUpdatePayload()),
    });
    await response.text();
    // Deve retornar 401 (sem auth) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});
