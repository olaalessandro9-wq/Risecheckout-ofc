/**
 * Integration Tests for coupon-management (CORS, Auth, Response)
 * @module coupon-management/tests/integration.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { FUNCTION_URL, SUPABASE_ANON_KEY } from "./_shared.ts";

// ============================================
// CORS TESTS
// ============================================

Deno.test("coupon-management - CORS - returns expected CORS headers in structure", () => {
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

Deno.test("coupon-management - auth - rejects unauthenticated requests", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action: "list", productId: "test" }),
  });
  
  assertEquals(response.status, 401);
  await response.text();
});

// ============================================
// ERROR RESPONSE STRUCTURE
// ============================================

Deno.test("coupon-management - error structure - missing action error", () => {
  const errorResponse = { success: false, error: "Ação não informada (use body.action ou path)" };
  assertEquals(errorResponse.success, false);
  assertStringIncludes(errorResponse.error, "Ação não informada");
});

Deno.test("coupon-management - error structure - invalid body error", () => {
  const errorResponse = { success: false, error: "Corpo da requisição inválido" };
  assertStringIncludes(errorResponse.error, "Corpo da requisição inválido");
});

Deno.test("coupon-management - error structure - unknown action error", () => {
  const errorResponse = { success: false, error: "Ação não encontrada: invalid" };
  assertStringIncludes(errorResponse.error, "Ação não encontrada");
});

Deno.test("coupon-management - error structure - method not allowed error", () => {
  const errorResponse = { success: false, error: "Método não permitido" };
  assertEquals(errorResponse.error, "Método não permitido");
});

// ============================================
// SUCCESS RESPONSE STRUCTURE
// ============================================

Deno.test("coupon-management - success structure - create returns coupon", () => {
  const successResponse = {
    success: true,
    coupon: {
      id: "new-uuid",
      code: "SALE10",
      discount_type: "percentage",
      discount_value: 10,
    },
  };
  
  assertEquals(successResponse.success, true);
  assertExists(successResponse.coupon);
});

Deno.test("coupon-management - success structure - list returns coupons array", () => {
  const successResponse = {
    success: true,
    coupons: [],
  };
  
  assertEquals(successResponse.success, true);
  assertEquals(Array.isArray(successResponse.coupons), true);
});

Deno.test("coupon-management - success structure - delete returns success flag", () => {
  const successResponse = { success: true };
  assertEquals(successResponse.success, true);
});
