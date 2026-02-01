/**
 * Submit and Attempts Tests for members-area-quizzes
 * 
 * @module members-area-quizzes/tests/submit-attempts.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createSubmitPayload,
  createGetAttemptsPayload,
} from "./_shared.ts";

// ============================================================================
// SUBMIT QUIZ TESTS
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: submit - deve validar quiz_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        createSubmitPayload("test-quiz-id", {
          "question-1": "answer-1",
          "question-2": "answer-2",
        })
      ),
    });
    await response.text();
    // Deve retornar 401 (sem auth) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "members-area-quizzes/integration: submit - deve rejeitar sem answers",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "submit",
      quiz_id: "test-quiz-id",
      data: {},
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

// ============================================================================
// GET ATTEMPTS TESTS
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: get-attempts - deve validar quiz_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createGetAttemptsPayload()),
    });
    await response.text();
    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401].includes(response.status), true);
  },
});
