/**
 * Execution Tests for alert-stuck-orders
 * 
 * @module alert-stuck-orders/tests/execution.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
} from "./_shared.ts";

// ============================================================================
// EXECUTION TESTS
// ============================================================================

Deno.test({
  name: "alert-stuck-orders/integration: POST executes stuck orders check",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await response.text();
    // Should return 200 even if no stuck orders found
    assertEquals(response.status, 200);
  },
});

Deno.test({
  name: "alert-stuck-orders/integration: Content-Type is application/json",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await response.text();
    assertEquals(
      response.headers.get("Content-Type")?.includes("application/json"),
      true
    );
  },
});

Deno.test({
  name: "alert-stuck-orders/integration: returns valid response structure",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    assertExists(data);
    assertEquals(typeof data, "object");
  },
});
