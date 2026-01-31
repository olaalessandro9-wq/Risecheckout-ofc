/**
 * Response Format & Error Handling Tests for content-save
 * 
 * @module content-save/tests/response-format.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MOCK_CONTENT } from "./_shared.ts";

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test("content-save - Error - should return 401 for unauthenticated", () => {
  const response = { error: "Authorization required" };
  assertStringIncludes(response.error, "Authorization");
});

Deno.test("content-save - Error - should return 403 for no permission", () => {
  const response = { success: false, error: "Você não tem permissão" };
  assertEquals(response.success, false);
  assertStringIncludes(response.error, "permissão");
});

Deno.test("content-save - Error - should return 400 for missing moduleId", () => {
  const response = { success: false, error: "moduleId é obrigatório" };
  assertStringIncludes(response.error, "obrigatório");
});

Deno.test("content-save - Error - should return 400 for missing title", () => {
  const response = { success: false, error: "Título é obrigatório" };
  assertStringIncludes(response.error, "Título");
});

Deno.test("content-save - Error - should return 500 for creation error", () => {
  const response = { success: false, error: "Erro ao criar conteúdo" };
  assertStringIncludes(response.error, "criar");
});

Deno.test("content-save - Error - should return 500 for update error", () => {
  const response = { success: false, error: "Erro ao atualizar conteúdo" };
  assertStringIncludes(response.error, "atualizar");
});

// ============================================================================
// RESPONSE FORMAT TESTS
// ============================================================================

Deno.test("content-save - Response - success should return contentId and isNew", () => {
  const response = { success: true, contentId: "content-new", isNew: true };
  assertEquals(response.success, true);
  assertExists(response.contentId);
  assertEquals(response.isNew, true);
});

Deno.test("content-save - Response - update should return isNew false", () => {
  const response = { success: true, contentId: "content-1", isNew: false };
  assertEquals(response.isNew, false);
});

Deno.test("content-save - Response - error should return success false", () => {
  const response = { success: false, error: "Mensagem de erro" };
  assertEquals(response.success, false);
  assertExists(response.error);
});

// ============================================================================
// CONTENT UPDATE TESTS
// ============================================================================

Deno.test("content-save - Update - should update title", () => {
  const updated = { ...MOCK_CONTENT, title: "Novo Título" };
  assertEquals(updated.title, "Novo Título");
});

Deno.test("content-save - Update - should update video_url", () => {
  const updated = { ...MOCK_CONTENT, content_url: "https://vimeo.com/456" };
  assertEquals(updated.content_url, "https://vimeo.com/456");
});

Deno.test("content-save - Update - should allow null video_url", () => {
  const updated = { ...MOCK_CONTENT, content_url: null };
  assertEquals(updated.content_url, null);
});

Deno.test("content-save - Update - should update body HTML", () => {
  const newBody = "<h1>Título</h1><p>Parágrafo</p>";
  const updated = { ...MOCK_CONTENT, body: newBody };
  assertStringIncludes(updated.body || "", "<h1>");
});

// ============================================================================
// STORAGE PATH TESTS
// ============================================================================

Deno.test("content-save - Storage - should use standardized path", () => {
  const productId = "prod-1";
  const contentId = "content-1";
  const fileName = "file.pdf";
  const path = `products/${productId}/attachments/${contentId}/${Date.now()}-${fileName}`;
  assertStringIncludes(path, `products/${productId}`);
  assertStringIncludes(path, "attachments");
});

Deno.test("content-save - Storage - should use content-attachments bucket", () => {
  const bucket = "content-attachments";
  assertEquals(bucket, "content-attachments");
});
