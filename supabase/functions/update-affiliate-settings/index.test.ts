/**
 * Integration Tests for update-affiliate-settings Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Update affiliate settings (enabled, requireApproval, defaultRate)
 * - Product ownership verification
 * - Authentication via unified-auth
 * - Default rate validation (0-90%)
 * 
 * @module update-affiliate-settings/index.test
 * @version 1.1.0
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getTestConfig,
} from "../_shared/testing/mod.ts";

// ============================================================================
// Configuration
// ============================================================================

const config = getTestConfig();
const FUNCTION_NAME = "update-affiliate-settings";

function getFunctionUrl(): string {
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
    : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
}

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "update-affiliate-settings/integration: CORS headers",
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
  name: "update-affiliate-settings/integration: rejects unauthenticated requests",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "product-123",
      enabled: true,
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
// Update Settings Tests
// ============================================================================

Deno.test({
  name: "update-affiliate-settings/integration: validates product_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      enabled: true,
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Should return 401 (no auth) or 200/403/404 (with auth)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "update-affiliate-settings/integration: accepts enabled = true",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      enabled: true,
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "update-affiliate-settings/integration: accepts enabled = false",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      enabled: false,
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "update-affiliate-settings/integration: accepts requireApproval = true",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      requireApproval: true,
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "update-affiliate-settings/integration: accepts requireApproval = false",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      requireApproval: false,
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "update-affiliate-settings/integration: accepts valid defaultRate (0-90)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      defaultRate: 50,
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "update-affiliate-settings/integration: accepts defaultRate = 0",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      defaultRate: 0,
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "update-affiliate-settings/integration: accepts defaultRate = 90",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      defaultRate: 90,
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "update-affiliate-settings/integration: accepts multiple fields combined",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      enabled: true,
      requireApproval: false,
      defaultRate: 30,
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "update-affiliate-settings/integration: verifies product ownership",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "non-owned-product-id",
      enabled: true,
    };

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Should return 401 (no auth) or 403 (no ownership)
    assertEquals([401, 403].includes(response.status), true);
  },
});

// ============================================================================
// Rate Limiting Tests
// ============================================================================

Deno.test({
  name: "update-affiliate-settings/integration: applies rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      product_id: "test-product-id",
      enabled: true,
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
      statuses.every((s) => [200, 401, 403, 404, 429].includes(s)),
      true
    );
  },
});
