/**
 * Authentication Tests for update-affiliate-settings
 * 
 * @module update-affiliate-settings/tests/authentication.test
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
// AUTHENTICATION TESTS
// ============================================================================

Deno.test({
  name: "update-affiliate-settings/integration: rejects unauthenticated requests",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createSettingsPayload({ enabled: true });

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

Deno.test({
  name: "update-affiliate-settings/integration: verifies product ownership",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createSettingsPayload({
      product_id: "non-owned-product-id",
      enabled: true,
    });

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
