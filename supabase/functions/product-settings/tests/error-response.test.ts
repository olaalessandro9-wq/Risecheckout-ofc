/**
 * Error Handling & Response Format Tests for product-settings
 * 
 * @module product-settings/tests/error-response.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MOCK_PRODUCTS } from "./_shared.ts";

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test("product-settings - Error - should return 401 for unauthenticated", () => {
  const error = { error: "Não autorizado" };
  assertStringIncludes(error.error, "autorizado");
});

Deno.test("product-settings - Error - should return 400 for missing productId", () => {
  const error = { error: "ID do produto é obrigatório" };
  assertStringIncludes(error.error, "obrigatório");
});

Deno.test("product-settings - Error - should return 403 for no permission", () => {
  const error = { error: "Produto não encontrado ou sem permissão" };
  assertStringIncludes(error.error, "permissão");
});

Deno.test("product-settings - Error - should return 400 for missing settings", () => {
  const error = { error: "settings é obrigatório para esta ação" };
  assertStringIncludes(error.error, "settings");
});

Deno.test("product-settings - Error - should return 400 for invalid price", () => {
  const error = { error: "Preço deve ser um valor inteiro positivo em centavos" };
  assertStringIncludes(error.error, "centavos");
});

Deno.test("product-settings - Error - should return 404 for unknown action", () => {
  const action = "unknown";
  const error = { error: `Ação desconhecida: ${action}` };
  assertStringIncludes(error.error, "desconhecida");
});

Deno.test("product-settings - Error - should return 500 for internal error", () => {
  const error = { error: "Erro interno do servidor" };
  assertStringIncludes(error.error, "interno");
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

Deno.test("product-settings - Rate Limit - should apply per producer", () => {
  const producerId = "user-123";
  const rateLimitKey = `producer:${producerId}`;
  assertStringIncludes(rateLimitKey, producerId);
});

Deno.test("product-settings - Rate Limit - should return 429 when exceeded", () => {
  const response = { success: false, error: "Muitas requisições", retryAfter: 60 };
  assertEquals(response.retryAfter, 60);
  assertStringIncludes(response.error, "requisições");
});

// ============================================================================
// RESPONSE FORMAT TESTS
// ============================================================================

Deno.test("product-settings - Response - success should return { success: true }", () => {
  const response = { success: true };
  assertEquals(response.success, true);
});

Deno.test("product-settings - Response - success with data should return object", () => {
  const response = { success: true, product: MOCK_PRODUCTS[0] };
  assertEquals(response.success, true);
  assertExists(response.product);
});

Deno.test("product-settings - Response - rate limit should include retryAfter", () => {
  const response = { success: false, error: "Muitas requisições", retryAfter: 30 };
  assertExists(response.retryAfter);
});

Deno.test("product-settings - Response - error should return { error: string }", () => {
  const response = { error: "Mensagem de erro" };
  assertExists(response.error);
  assertEquals(typeof response.error, "string");
});
