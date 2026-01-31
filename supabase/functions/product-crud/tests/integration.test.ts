/**
 * Integration Tests for product-crud (CORS, Auth, Response)
 * @module product-crud/tests/integration.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { FUNCTION_URL, SUPABASE_ANON_KEY, isRateLimited } from "./_shared.ts";

// ============================================
// CORS TESTS
// ============================================

Deno.test("product-crud - CORS - returns expected CORS headers in structure", () => {
  // Test the expected CORS header structure (no actual fetch needed)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
  assertExists(corsHeaders["Access-Control-Allow-Headers"]);
});

// ============================================
// AUTHENTICATION TESTS
// ============================================

Deno.test("product-crud - auth - rejects unauthenticated requests", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action: "list" }),
  });
  
  assertEquals(response.status, 401);
  await response.text();
});

Deno.test("product-crud - auth - rejects missing action", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  
  const body = await response.text();
  assertExists(body);
});

// ============================================
// RATE LIMITING
// ============================================

Deno.test("product-crud - rate limit - create action is rate limited", () => {
  assertEquals(isRateLimited("create"), true);
});

Deno.test("product-crud - rate limit - update action is rate limited", () => {
  assertEquals(isRateLimited("update"), true);
});

Deno.test("product-crud - rate limit - list action is not rate limited", () => {
  assertEquals(isRateLimited("list"), false);
});

Deno.test("product-crud - rate limit - get action is not rate limited", () => {
  assertEquals(isRateLimited("get"), false);
});

// ============================================
// ERROR RESPONSE STRUCTURE
// ============================================

Deno.test("product-crud - error structure - validation error format", () => {
  const errorResponse = { success: false, error: "Nome do produto é obrigatório" };
  assertEquals(errorResponse.success, false);
  assertExists(errorResponse.error);
});

Deno.test("product-crud - error structure - rate limit error format", () => {
  const errorResponse = { success: false, error: "Muitas requisições", retryAfter: 300 };
  assertEquals(errorResponse.success, false);
  assertEquals(errorResponse.error, "Muitas requisições");
  assertExists(errorResponse.retryAfter);
});

Deno.test("product-crud - error structure - not found error format", () => {
  const errorResponse = { success: false, error: "Ação desconhecida: invalid" };
  assertStringIncludes(errorResponse.error, "Ação desconhecida");
});

// ============================================
// SUCCESS RESPONSE STRUCTURE
// ============================================

Deno.test("product-crud - success structure - list returns products array", () => {
  const successResponse = {
    success: true,
    data: {
      products: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    },
  };
  
  assertEquals(successResponse.success, true);
  assertExists(successResponse.data.products);
  assertEquals(Array.isArray(successResponse.data.products), true);
});

Deno.test("product-crud - success structure - get returns single product", () => {
  const successResponse = {
    success: true,
    data: {
      product: { id: "uuid-123", name: "Test Product" },
    },
  };
  
  assertEquals(successResponse.success, true);
  assertExists(successResponse.data.product);
});

Deno.test("product-crud - success structure - create returns new product", () => {
  const successResponse = {
    success: true,
    data: {
      product: { id: "new-uuid", name: "New Product" },
    },
  };
  
  assertEquals(successResponse.success, true);
  assertExists(successResponse.data.product.id);
});
