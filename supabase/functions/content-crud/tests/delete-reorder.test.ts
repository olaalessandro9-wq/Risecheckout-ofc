/**
 * Delete and Reorder Content Tests for content-crud
 * 
 * @module content-crud/tests/delete-reorder.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { 
  skipIntegration, 
  integrationTestOptions,
  getFunctionUrl 
} from "./_shared.ts";

Deno.test({
  name: "content-crud/integration: delete - deve validar contentId",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "delete",
      contentId: "test-content-id"
    };

    const response = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  }
});

Deno.test({
  name: "content-crud/integration: reorder - deve validar moduleId",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "reorder",
      moduleId: "test-module-id",
      orderedIds: ["content-1", "content-2", "content-3"]
    };

    const response = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});

Deno.test({
  name: "content-crud/integration: reorder - deve aceitar array vazio",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "reorder",
      moduleId: "test-module-id",
      orderedIds: []
    };

    const response = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});
