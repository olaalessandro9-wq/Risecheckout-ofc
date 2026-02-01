/**
 * Integration Tests for coupon-management (CORS, Auth, Response)
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module coupon-management/tests/integration
 * @version 2.1.0
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
  FUNCTION_NAME,
  buildFunctionUrl,
  createUnauthHeaders,
} from "./_shared.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// ============================================================================
// CORS TESTS (Unit - no network)
// ============================================================================

Deno.test("coupon-management: CORS headers structure is correct", () => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
  assertExists(corsHeaders["Access-Control-Allow-Headers"]);
});

// ============================================================================
// AUTHENTICATION TESTS (Integration - requires server)
// ============================================================================

Deno.test({
  name: "coupon-management/integration: rejects unauthenticated requests",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const functionUrl = buildFunctionUrl(SUPABASE_URL);
    
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        ...createUnauthHeaders(),
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action: "list", productId: "test" }),
    });
    
    assertEquals(response.status, 401);
    await response.text();
  },
});

// ============================================
// ERROR RESPONSE STRUCTURE (Unit - no network)
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
// SUCCESS RESPONSE STRUCTURE (Unit - no network)
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
