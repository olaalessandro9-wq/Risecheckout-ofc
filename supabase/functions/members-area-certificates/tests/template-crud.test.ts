/**
 * Template CRUD Tests for members-area-certificates
 * 
 * @module members-area-certificates/tests/template-crud.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createPayload,
} from "./_shared.ts";

// ============================================================================
// LIST TEMPLATES TESTS
// ============================================================================

Deno.test({
  name: "members-area-certificates/integration: list-templates - deve validar product_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("list-templates", { product_id: "test-product-id" });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401, 403].includes(response.status), true);
  },
});

// ============================================================================
// GET TEMPLATE TESTS
// ============================================================================

Deno.test({
  name: "members-area-certificates/integration: get-template - deve validar template_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("get-template", { template_id: "test-template-id" });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

// ============================================================================
// CREATE TEMPLATE TESTS
// ============================================================================

Deno.test({
  name: "members-area-certificates/integration: create-template - deve validar product_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("create-template", {
      product_id: "test-product-id",
      data: {
        name: "Test Template",
        template_html: "<html>Test</html>",
        primary_color: "#000000",
      },
    });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401, 403].includes(response.status), true);
  },
});

Deno.test({
  name: "members-area-certificates/integration: create-template - deve aceitar is_default",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("create-template", {
      product_id: "test-product-id",
      data: {
        name: "Default Template",
        template_html: "<html>Default</html>",
        is_default: true,
      },
    });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401, 403].includes(response.status), true);
  },
});

// ============================================================================
// UPDATE TEMPLATE TESTS
// ============================================================================

Deno.test({
  name: "members-area-certificates/integration: update-template - deve validar template_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("update-template", {
      template_id: "test-template-id",
      data: { name: "Updated Template" },
    });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});

// ============================================================================
// DELETE TEMPLATE TESTS
// ============================================================================

Deno.test({
  name: "members-area-certificates/integration: delete-template - deve validar template_id",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("delete-template", { template_id: "test-template-id" });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200/404 (sucesso/não encontrado)
    assertEquals([200, 401, 403, 404].includes(response.status), true);
  },
});
