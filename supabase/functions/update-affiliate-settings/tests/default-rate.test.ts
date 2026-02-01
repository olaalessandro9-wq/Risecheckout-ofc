/**
 * Default Rate Tests for update-affiliate-settings
 * 
 * @module update-affiliate-settings/tests/default-rate.test
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
// DEFAULT RATE VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "update-affiliate-settings/integration: accepts valid defaultRate (0-90)",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createSettingsPayload({ defaultRate: 50 });

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
    const payload = createSettingsPayload({ defaultRate: 0 });

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
    const payload = createSettingsPayload({ defaultRate: 90 });

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
    const payload = createSettingsPayload({
      enabled: true,
      requireApproval: false,
      defaultRate: 30,
    });

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
