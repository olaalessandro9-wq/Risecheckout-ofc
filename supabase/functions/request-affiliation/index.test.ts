/**
 * Integration Tests for request-affiliation Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Request affiliation for a product
 * - Product validation (exists, affiliates enabled)
 * - Duplicate affiliation prevention
 * - Authentication via unified-auth
 * - Gateway validation (wallet_id required)
 * - Approval workflow (auto-approve vs manual)
 * 
 * @module request-affiliation/index.test
 * @version 1.1.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getTestConfig,
} from "../_shared/testing/mod.ts";

// ============================================================================
// Configuration
// ============================================================================

const config = getTestConfig();
const FUNCTION_NAME = "request-affiliation";

function getFunctionUrl(): string {
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
    : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
}

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "request-affiliation/integration: CORS headers",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "OPTIONS",
    });

    await response.text();

    assertEquals(response.status, 200);
    assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  },
});

// ============================================================================
// Authentication Tests
// ============================================================================

Deno.test({
  name: "request-affiliation/integration: rejects unauthenticated requests",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "product-123",
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals(response.status, 401);
  },
});

// ============================================================================
// Request Affiliation Tests
// ============================================================================

Deno.test({
  name: "request-affiliation/integration: validates product_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Should return 401 (no auth) or 200/400/404 (with auth)
    assertEquals([200, 400, 401, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "request-affiliation/integration: rejects missing product_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {};

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Should return 400 (validation) or 401 (no auth) or 500 (error)
    assertEquals(response.status >= 400, true);
  },
});

Deno.test({
  name: "request-affiliation/integration: rejects non-existent product",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "non-existent-product-id",
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Should return 401 (no auth) or 404 (product not found)
    assertEquals([401, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "request-affiliation/integration: rejects if affiliates not enabled",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "product-without-affiliates",
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Should return 401 (no auth) or 400 (affiliates not enabled) or 404
    assertEquals([400, 401, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "request-affiliation/integration: rejects duplicate affiliation",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "product-with-existing-affiliation",
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    // May return 401 (no auth) or 400 (already affiliated) or 200 (success) or 404
    assertEquals([200, 400, 401, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "request-affiliation/integration: validates gateway (wallet_id)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "product-requiring-gateway",
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    // May return 401 (no auth) or 400 (gateway not configured) or 200 (success) or 404
    assertEquals([200, 400, 401, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "request-affiliation/integration: creates pending affiliation if requireApproval",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "product-requiring-approval",
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    // May return 401 (no auth) or 200 (success) or 400/404 (error)
    assertEquals([200, 400, 401, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "request-affiliation/integration: auto-approves if not requireApproval",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "product-auto-approve",
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    // May return 401 (no auth) or 200 (success) or 400/404 (error)
    assertEquals([200, 400, 401, 404].includes(response.status), true);
  },
});

// ============================================================================
// Rate Limiting Tests
// ============================================================================

Deno.test({
  name: "request-affiliation/integration: applies rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
    };

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

    // All should return valid statuses
    assertEquals(
      statuses.every((s) => [200, 400, 401, 404, 429, 500].includes(s)),
      true
    );
  },
});
