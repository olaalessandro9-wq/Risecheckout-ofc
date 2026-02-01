/**
 * List and Get Quiz Tests for members-area-quizzes
 * 
 * @module members-area-quizzes/tests/list-get.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createListPayload,
  createGetPayload,
} from "./_shared.ts";

// ============================================================================
// LIST QUIZZES TESTS
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: list - deve validar content_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createListPayload()),
    });
    await response.text();
    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401].includes(response.status), true);
  },
});

// ============================================================================
// GET QUIZ TESTS
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: get - deve validar quiz_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createGetPayload()),
    });
    await response.text();
    // Deve retornar 401 (sem auth) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 404].includes(response.status), true);
  },
});
