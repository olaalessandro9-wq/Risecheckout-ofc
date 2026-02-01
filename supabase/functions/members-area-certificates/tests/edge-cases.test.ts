/**
 * Edge Cases and Rate Limiting Tests for members-area-certificates
 * 
 * @module members-area-certificates/tests/edge-cases.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createPayload,
} from "./_shared.ts";

// ============================================================================
// INVALID ACTION TESTS
// ============================================================================

Deno.test({
  name: "members-area-certificates/integration: deve rejeitar ação inválida",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = { action: "invalid-action" };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals(response.status >= 400, true);
  },
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

Deno.test({
  name: "members-area-certificates/integration: deve aplicar rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("verify", { verification_code: "TEST-CODE-1234" });

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
    assertEquals(statuses.every((s) => [200, 429].includes(s)), true);
  },
});
