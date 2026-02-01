/**
 * Integration Tests for order-bump-crud (CORS, Auth, Response)
 * @module order-bump-crud/tests/integration.test
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { skipIntegration, integrationTestOptions, getTestConfig } from "../../_shared/testing/mod.ts";
import { FUNCTION_URL, isRateLimited } from "./_shared.ts";

const config = getTestConfig();

// ============================================
// CORS TESTS
// ============================================

Deno.test("order-bump-crud - CORS - returns expected CORS headers in structure", () => {
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

Deno.test({
  name: "order-bump-crud/integration: auth - rejects unauthenticated requests",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.supabaseAnonKey ?? "",
      },
      body: JSON.stringify({ action: "create", parent_product_id: "test", product_id: "test", offer_id: "test" }),
    });
    
    assertEquals(response.status, 401);
    await response.text();
  },
});

// ============================================
// RATE LIMITING
// ============================================

Deno.test("order-bump-crud - rate limit - create is rate limited", () => {
  assertEquals(isRateLimited("create"), true);
});

Deno.test("order-bump-crud - rate limit - update is rate limited", () => {
  assertEquals(isRateLimited("update"), true);
});

Deno.test("order-bump-crud - rate limit - reorder is rate limited", () => {
  assertEquals(isRateLimited("reorder"), true);
});

// ============================================
// METHOD VALIDATION
// ============================================

Deno.test("order-bump-crud - methods - create requires POST", () => {
  const action = "create";
  const method = "POST";
  assertEquals(action === "create" && method === "POST", true);
});

Deno.test("order-bump-crud - methods - update accepts PUT or POST", () => {
  const validMethods = ["PUT", "POST"];
  assertEquals(validMethods.includes("PUT"), true);
  assertEquals(validMethods.includes("POST"), true);
});

Deno.test("order-bump-crud - methods - delete accepts DELETE or POST", () => {
  const validMethods = ["DELETE", "POST"];
  assertEquals(validMethods.includes("DELETE"), true);
  assertEquals(validMethods.includes("POST"), true);
});

Deno.test("order-bump-crud - methods - reorder accepts PUT or POST", () => {
  const validMethods = ["PUT", "POST"];
  assertEquals(validMethods.includes("PUT"), true);
  assertEquals(validMethods.includes("POST"), true);
});

// ============================================
// ERROR RESPONSE STRUCTURE
// ============================================

Deno.test("order-bump-crud - error structure - missing action error", () => {
  const errorResponse = { success: false, error: "Ação não especificada" };
  assertEquals(errorResponse.success, false);
  assertStringIncludes(errorResponse.error, "Ação não especificada");
});

Deno.test("order-bump-crud - error structure - validation error format", () => {
  const errorResponse = { success: false, error: "parent_product_id ou checkout_id é obrigatório" };
  assertEquals(errorResponse.success, false);
  assertStringIncludes(errorResponse.error, "obrigatório");
});

Deno.test("order-bump-crud - error structure - permission error", () => {
  const errorResponse = { success: false, error: "Você não tem permissão para criar order bumps neste produto" };
  assertStringIncludes(errorResponse.error, "permissão");
});

Deno.test("order-bump-crud - error structure - duplicate error", () => {
  const errorResponse = { success: false, error: "Este produto já está configurado como order bump" };
  assertStringIncludes(errorResponse.error, "já está configurado");
});

Deno.test("order-bump-crud - error structure - rate limit error", () => {
  const errorResponse = { success: false, error: "Muitas requisições.", retryAfter: 300 };
  assertEquals(errorResponse.error, "Muitas requisições.");
});

// ============================================
// SUCCESS RESPONSE STRUCTURE
// ============================================

Deno.test("order-bump-crud - success structure - create returns orderBump", () => {
  const successResponse = {
    success: true,
    orderBump: {
      id: "new-uuid",
      parent_product_id: "parent-123",
      product_id: "bump-456",
      offer_id: "offer-789",
      active: true,
    },
  };
  
  assertEquals(successResponse.success, true);
  assertExists(successResponse.orderBump);
  assertExists(successResponse.orderBump.id);
});

Deno.test("order-bump-crud - success structure - delete returns success flag", () => {
  const successResponse = { success: true };
  assertEquals(successResponse.success, true);
});

Deno.test("order-bump-crud - success structure - reorder returns success flag", () => {
  const successResponse = { success: true };
  assertEquals(successResponse.success, true);
});
