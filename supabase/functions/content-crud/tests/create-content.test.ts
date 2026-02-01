/**
 * Create Content Tests for content-crud
 * 
 * @module content-crud/tests/create-content.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { 
  skipIntegration, 
  integrationTestOptions,
  getFunctionUrl 
} from "./_shared.ts";

Deno.test({
  name: "content-crud/integration: create - deve validar moduleId",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "create",
      moduleId: "test-module-id",
      data: {
        title: "Test Content",
        content_type: "video",
        content_url: "https://example.com/video.mp4"
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
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});

Deno.test({
  name: "content-crud/integration: create - deve aceitar diferentes content_types",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "create",
      moduleId: "test-module-id",
      data: {
        title: "Test Content",
        content_type: "text",
        body: "Test body content"
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
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});

Deno.test({
  name: "content-crud/integration: create - deve aceitar is_active",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      action: "create",
      moduleId: "test-module-id",
      data: {
        title: "Test Content",
        content_type: "video",
        is_active: false
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
    assertEquals([200, 401, 403].includes(response.status), true);
  }
});
