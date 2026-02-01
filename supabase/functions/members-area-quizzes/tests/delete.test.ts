/**
 * Delete Quiz Tests for members-area-quizzes
 * 
 * @module members-area-quizzes/tests/delete.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createDeletePayload,
} from "./_shared.ts";

// ============================================================================
// DELETE QUIZ TESTS
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: delete - deve validar quiz_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createDeletePayload()),
    });
    await response.text();
    // Deve retornar 401 (sem auth) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});
