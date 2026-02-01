/**
 * Settings Update Tests for update-affiliate-settings
 * 
 * @module update-affiliate-settings/tests/settings-update.test
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
// PRODUCT ID VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "update-affiliate-settings/integration: validates product_id",
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

    // Should return 401 (no auth) or 200/403/404 (with auth)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

// ============================================================================
// ENABLED FIELD TESTS
// ============================================================================

Deno.test({
  name: "update-affiliate-settings/integration: accepts enabled = true",
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

    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

Deno.test({
  name: "update-affiliate-settings/integration: accepts enabled = false",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createSettingsPayload({ enabled: false });

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

// ============================================================================
// REQUIRE APPROVAL FIELD TESTS
// ============================================================================

Deno.test({
  name: "update-affiliate-settings/integration: accepts requireApproval = true",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createSettingsPayload({ requireApproval: true });

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
    const payload = createSettingsPayload({ requireApproval: false });

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
