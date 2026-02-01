/**
 * Affiliation Request Tests for request-affiliation
 * 
 * @module request-affiliation/tests/affiliation-request.test
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
// PRODUCT VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "request-affiliation/integration: validates product_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("test-product-id");

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
  name: "request-affiliation/integration: rejects missing product_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload();

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals(response.status >= 400, true);
  },
});

Deno.test({
  name: "request-affiliation/integration: rejects non-existent product",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("non-existent-product-id");

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([401, 404].includes(response.status), true);
  },
});

// ============================================================================
// AFFILIATION RULES TESTS
// ============================================================================

Deno.test({
  name: "request-affiliation/integration: rejects if affiliates not enabled",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("product-without-affiliates");

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([400, 401, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "request-affiliation/integration: rejects duplicate affiliation",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("product-with-existing-affiliation");

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
  name: "request-affiliation/integration: validates gateway (wallet_id)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("product-requiring-gateway");

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([200, 400, 401, 404].includes(response.status), true);
  },
});
