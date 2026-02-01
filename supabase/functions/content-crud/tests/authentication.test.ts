/**
 * Authentication Tests for content-crud
 * 
 * @module content-crud/tests/authentication.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { 
  skipIntegration, 
  integrationTestOptions,
  getFunctionUrl 
} from "./_shared.ts";

Deno.test({
  name: "content-crud/integration: Deve rejeitar request sem autenticação",
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

    const response = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    await response.text();
    assertEquals(response.status, 401);
  }
});
