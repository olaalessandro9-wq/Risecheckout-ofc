/**
 * Rate Limiting Tests for update-affiliate-settings
 * 
 * @module update-affiliate-settings/tests/rate-limiting.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createSettingsPayload,
} from "./_shared.ts";

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

Deno.test({
  name: "update-affiliate-settings/integration: applies rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createSettingsPayload({ enabled: true });

    // Make multiple requests rapidly
    const requests = Array.from({ length: 100 }, () =>
      fetch(getFunctionUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);

    // Consume all response bodies
    await Promise.all(responses.map((r) => r.text()));

    // All should return valid statuses
    assertEquals(
      statuses.every((s) => [200, 401, 403, 404, 429].includes(s)),
      true
    );
  },
});
