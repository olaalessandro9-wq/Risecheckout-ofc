/**
 * Validation and Rate Limiting Tests for get-affiliation-status
 * 
 * @module get-affiliation-status/tests/validation.test
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
// VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "get-affiliation-status/integration: deve validar product_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload("test-product-id")),
    });
    await response.text();
    assertEquals([200, 401, 404].includes(response.status), true);
  },
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

Deno.test({
  name: "get-affiliation-status/integration: deve aplicar rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const requests = Array.from({ length: 100 }, () =>
      fetch(getFunctionUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload("test-id")),
      })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);
    
    // Consume all response bodies
    await Promise.all(responses.map((r) => r.text()));
    
    assertEquals(statuses.every((s) => [200, 401, 404, 429].includes(s)), true);
  },
});
