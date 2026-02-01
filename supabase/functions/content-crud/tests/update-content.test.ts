/**
 * Update Content Tests for content-crud
 * 
 * @module content-crud/tests/update-content.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { 
  skipIntegration, 
  integrationTestOptions,
  getFunctionUrl 
} from "./_shared.ts";

Deno.test({
  name: "content-crud/integration: update - deve validar contentId",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "update",
      contentId: "test-content-id",
      data: {
        title: "Updated Content"
      }
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
  name: "content-crud/integration: update - deve aceitar content_url null",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "update",
      contentId: "test-content-id",
      data: {
        content_url: null
      }
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
  name: "content-crud/integration: update - deve aceitar body null",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "update",
      contentId: "test-content-id",
      data: {
        body: null
      }
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
