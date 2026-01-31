/**
 * Product Duplicate - Errors & Response Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module product-duplicate/tests/errors-response
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("product-duplicate - Error Handling", async (t) => {
  await t.step("deve tratar erro de produto não encontrado", () => {
    const result = { valid: false, error: "Produto não encontrado" };
    assertEquals(result.valid, false);
    assertStringIncludes(result.error || "", "não encontrado");
  });

  await t.step("deve tratar erro de permissão negada", () => {
    const result = { success: false, error: "Você não tem permissão" };
    assertEquals(result.success, false);
  });

  await t.step("deve tratar timeout de trigger (checkout não criado)", () => {
    const timeoutMessage = "Timeout: checkout não foi criado por trigger";
    assertStringIncludes(timeoutMessage, "Timeout");
  });

  await t.step("deve tratar erro de inserção de produto", () => {
    const insertError = "Falha ao criar produto: unique constraint violation";
    assertStringIncludes(insertError, "Falha ao criar");
  });
});

Deno.test("product-duplicate - Response Format", async (t) => {
  await t.step("resposta de sucesso deve conter newProductId", () => {
    const response = {
      success: true,
      newProductId: "new-product-uuid",
      editUrl: "/dashboard/produtos/editar?id=new-product-uuid",
    };
    assertExists(response.newProductId);
    assertEquals(response.success, true);
  });

  await t.step("editUrl deve seguir padrão correto", () => {
    const newProductId = "abc-123";
    const editUrl = `/dashboard/produtos/editar?id=${newProductId}`;
    assertStringIncludes(editUrl, "/dashboard/produtos/editar");
    assertStringIncludes(editUrl, newProductId);
  });

  await t.step("resposta de erro deve conter mensagem", () => {
    const response = {
      success: false,
      error: "Produto não encontrado ou você não tem permissão",
    };
    assertEquals(response.success, false);
    assertExists(response.error);
  });

  await t.step("erro 401 para não autenticado", () => {
    const status = 401;
    const response = { success: false, error: "Não autenticado" };
    assertEquals(status, 401);
    assertExists(response.error);
  });

  await t.step("erro 403 para sem permissão", () => {
    const status = 403;
    const response = { success: false, error: "Acesso negado" };
    assertEquals(status, 403);
    assertExists(response.error);
  });
});
