/**
 * Response Building Tests for marketplace-public
 * 
 * @module marketplace-public/tests/response-building.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  buildProductsResponse, 
  buildErrorResponse, 
  filterByCategory, 
  filterByCommission, 
  sortProducts, 
  paginateProducts,
  MOCK_PRODUCTS 
} from "./_shared.ts";

// ============================================================================
// RESPONSE BUILDING TESTS
// ============================================================================

Deno.test("marketplace-public - Response - products response structure", () => {
  const response = buildProductsResponse(MOCK_PRODUCTS);
  assertExists(response.products);
  assertEquals(response.products.length, MOCK_PRODUCTS.length);
});

Deno.test("marketplace-public - Response - error response structure", () => {
  const response = buildErrorResponse("Produto não encontrado", "NOT_FOUND");
  assertEquals(response.error, "Produto não encontrado");
  assertEquals(response.code, "NOT_FOUND");
});

Deno.test("marketplace-public - Response - validation error", () => {
  const response = buildErrorResponse("productId é obrigatório", "VALIDATION_ERROR");
  assertStringIncludes(response.error, "productId");
  assertEquals(response.code, "VALIDATION_ERROR");
});

Deno.test("marketplace-public - Response - invalid action error", () => {
  const response = buildErrorResponse("Ação desconhecida: xyz", "INVALID_ACTION");
  assertStringIncludes(response.error, "Ação desconhecida");
  assertEquals(response.code, "INVALID_ACTION");
});

// ============================================================================
// FULL PIPELINE TEST
// ============================================================================

Deno.test("marketplace-public - Pipeline - full filter pipeline", () => {
  let result = filterByCategory(MOCK_PRODUCTS, "vendas");
  result = filterByCommission(result, 40, 60);
  result = sortProducts(result, "commission");
  result = paginateProducts(result, 10, 0);
  assertEquals(result.length, 1);
  assertEquals(result[0].commission_percentage, 50);
});
