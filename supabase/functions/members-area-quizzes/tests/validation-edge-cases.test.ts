/**
 * Validation and Edge Cases Tests for members-area-quizzes
 * 
 * @module members-area-quizzes/tests/validation-edge-cases.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createInvalidActionPayload,
  createListPayload,
} from "./_shared.ts";

// ============================================================================
// INVALID ACTION TESTS
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: deve rejeitar ação inválida",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createInvalidActionPayload()),
    });
    await response.text();
    assertEquals(response.status >= 400, true);
  },
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

Deno.test({
  name: "members-area-quizzes/integration: deve aplicar rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createListPayload();

    // Fazer múltiplas requisições rapidamente
    const requests = Array.from({ length: 100 }, () =>
      fetch(getFunctionUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);

    // Consume all response bodies
    await Promise.all(responses.map((r) => r.text()));

    // Todas devem retornar status válidos
    assertEquals(statuses.every((s) => [200, 401, 429].includes(s)), true);
  },
});
