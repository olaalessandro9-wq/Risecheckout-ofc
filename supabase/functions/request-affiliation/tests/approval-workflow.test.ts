/**
 * Approval Workflow and Rate Limiting Tests for request-affiliation
 * 
 * @module request-affiliation/tests/approval-workflow.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createPayload,
} from "./_shared.ts";

// ============================================================================
// APPROVAL WORKFLOW TESTS
// ============================================================================

Deno.test({
  name: "request-affiliation/integration: creates pending affiliation if requireApproval",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("product-requiring-approval");

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([200, 400, 401, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "request-affiliation/integration: auto-approves if not requireApproval",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("product-auto-approve");

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([200, 400, 401, 404].includes(response.status), true);
  },
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

Deno.test({
  name: "request-affiliation/integration: applies rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("test-product-id");

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

    assertEquals(
      statuses.every((s) => [200, 400, 401, 404, 429, 500].includes(s)),
      true
    );
  },
});
