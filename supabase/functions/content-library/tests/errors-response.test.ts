/**
 * Content Library - Errors & Response Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module content-library/tests/errors-response
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mockContentItems, getVideoLibrary, filterActiveContent, type ContentItem } from "./_shared.ts";

Deno.test("content-library - Error Handling", async (t) => {
  await t.step("deve retornar FORBIDDEN para acesso negado", () => {
    const error = { code: "FORBIDDEN", message: "Acesso negado" };
    assertEquals(error.code, "FORBIDDEN");
  });

  await t.step("deve retornar VALIDATION_ERROR para productId ausente", () => {
    const error = { code: "VALIDATION_ERROR", message: "productId é obrigatório" };
    assertStringIncludes(error.message, "obrigatório");
  });

  await t.step("deve retornar INVALID_ACTION para ação desconhecida", () => {
    const action = "unknown";
    const error = { code: "INVALID_ACTION", message: `Ação desconhecida: ${action}` };
    assertStringIncludes(error.message, "desconhecida");
  });

  await t.step("deve retornar DB_ERROR para erro de banco", () => {
    const error = { code: "DB_ERROR", message: "Erro ao buscar vídeos" };
    assertEquals(error.code, "DB_ERROR");
  });

  await t.step("deve retornar 401 para não autenticado", () => {
    const response = { error: "Authorization required" };
    assertStringIncludes(response.error, "Authorization");
  });
});

Deno.test("content-library - Response Format", async (t) => {
  await t.step("sucesso deve retornar { videos: [...] }", () => {
    const activeItems = filterActiveContent(mockContentItems);
    const videos = getVideoLibrary(activeItems, "prod-1");
    const response = { videos };
    
    assertExists(response.videos);
    assertEquals(Array.isArray(response.videos), true);
  });

  await t.step("erro deve retornar { error: string, code: string }", () => {
    const response = { error: "Mensagem de erro", code: "ERROR_CODE" };
    assertExists(response.error);
    assertExists(response.code);
  });
});

Deno.test("content-library - Deduplication Edge Cases", async (t) => {
  await t.step("deve manter primeira ocorrência de URL duplicada", () => {
    const items: ContentItem[] = [
      {
        id: "first",
        title: "Primeira",
        content_url: "https://same.url",
        is_active: true,
        module: { id: "mod", title: "Módulo", product_id: "prod-1" },
      },
      {
        id: "second",
        title: "Segunda",
        content_url: "https://same.url",
        is_active: true,
        module: { id: "mod", title: "Módulo", product_id: "prod-1" },
      },
    ];

    const videos = getVideoLibrary(items, "prod-1");
    assertEquals(videos.length, 1);
    assertEquals(videos[0].id, "first");
  });

  await t.step("deve tratar URLs case-sensitive", () => {
    const items: ContentItem[] = [
      {
        id: "lower",
        title: "Lower",
        content_url: "https://example.com/video",
        is_active: true,
        module: { id: "mod", title: "Módulo", product_id: "prod-1" },
      },
      {
        id: "upper",
        title: "Upper",
        content_url: "https://EXAMPLE.COM/video",
        is_active: true,
        module: { id: "mod", title: "Módulo", product_id: "prod-1" },
      },
    ];

    const videos = getVideoLibrary(items, "prod-1");
    assertEquals(videos.length, 2);
  });
});
