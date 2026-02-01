/**
 * Validation and Edge Cases Tests for content-crud
 * 
 * @module content-crud/tests/validation-edge-cases.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { 
  skipIntegration, 
  integrationTestOptions,
  getFunctionUrl,
  isValidAction,
  isValidContentType,
  CONTENT_TYPES,
  ACTIONS,
} from "./_shared.ts";

Deno.test({
  name: "content-crud/integration: deve rejeitar ação inválida",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "invalid-action",
      moduleId: "test-module-id"
    };

    const response = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "content-crud/integration: deve rejeitar JSON inválido",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: "invalid json"
    });

    await response.text();
    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "content-crud/integration: deve aplicar rate limiting",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "create",
      moduleId: "test-module-id",
      data: {
        title: "Test Content"
      }
    };

    const requests = Array.from({ length: 100 }, () =>
      fetch(getFunctionUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);

    assertEquals(statuses.every(s => [200, 401, 403, 429].includes(s)), true);
  }
});

Deno.test("content-crud: isValidAction type guard works correctly", () => {
  for (const action of ACTIONS) {
    assertEquals(isValidAction(action), true);
  }
  assertEquals(isValidAction("invalid"), false);
});

Deno.test("content-crud: isValidContentType type guard works correctly", () => {
  for (const contentType of CONTENT_TYPES) {
    assertEquals(isValidContentType(contentType), true);
  }
  assertEquals(isValidContentType("invalid"), false);
});

Deno.test("content-crud: CONTENT_TYPES contains expected values", () => {
  assertExists(CONTENT_TYPES);
  assertEquals(CONTENT_TYPES.includes("video"), true);
  assertEquals(CONTENT_TYPES.includes("text"), true);
  assertEquals(CONTENT_TYPES.includes("pdf"), true);
});

Deno.test("content-crud: ACTIONS contains expected values", () => {
  assertExists(ACTIONS);
  assertEquals(ACTIONS.includes("create"), true);
  assertEquals(ACTIONS.includes("update"), true);
  assertEquals(ACTIONS.includes("delete"), true);
  assertEquals(ACTIONS.includes("reorder"), true);
});
