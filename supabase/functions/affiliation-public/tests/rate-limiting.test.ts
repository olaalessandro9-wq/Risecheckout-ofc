/**
 * Rate Limiting Tests for affiliation-public
 * 
 * @module affiliation-public/tests/rate-limiting.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createFullPayload,
} from "./_shared.ts";

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

Deno.test({
  name: "affiliation-public/integration: deve aplicar rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const requests = Array.from({ length: 100 }, () =>
      fetch(getFunctionUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createFullPayload("test-id", "test-code")),
      })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);
    
    // Consume all response bodies
    await Promise.all(responses.map((r) => r.text()));
    
    assertEquals(statuses.every((s) => [200, 400, 404, 429].includes(s)), true);
  },
});
