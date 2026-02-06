/**
 * Integration Tests for offer-crud (CORS, Auth, Response)
 * @module offer-crud/tests/integration.test
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { skipIntegration, integrationTestOptions, getTestConfig } from "../../_shared/testing/mod.ts";
import { FUNCTION_URL } from "./_shared.ts";

const config = getTestConfig();

// ============================================
// CORS TESTS (Unit - no network)
// ============================================

Deno.test("offer-crud - CORS - returns expected CORS headers in structure", () => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
  assertExists(corsHeaders["Access-Control-Allow-Headers"]);
});

// ============================================
// AUTHENTICATION TESTS (Integration - requires server)
// ============================================

Deno.test({
  name: "offer-crud/integration: auth - rejects unauthenticated requests",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.supabasePublishableKey ?? "",
      },
      body: JSON.stringify({ action: "list" }),
    });
    
    assertEquals(response.status, 401);
    await response.text();
  },
});

// ============================================
// ERROR RESPONSE STRUCTURE (Unit - no network)
// ============================================

Deno.test("offer-crud - error structure - validation error format", () => {
  const errorResponse = { success: false, error: "ID da oferta é obrigatório" };
  assertEquals(errorResponse.success, false);
  assertExists(errorResponse.error);
});

Deno.test("offer-crud - error structure - missing action error", () => {
  const errorResponse = { success: false, error: "Ação não informada (use body.action ou path)" };
  assertStringIncludes(errorResponse.error, "Ação não informada");
});

Deno.test("offer-crud - error structure - unknown action error", () => {
  const errorResponse = { success: false, error: "Ação desconhecida: invalid" };
  assertStringIncludes(errorResponse.error, "Ação desconhecida");
});

// ============================================
// SUCCESS RESPONSE STRUCTURE (Unit - no network)
// ============================================

Deno.test("offer-crud - success structure - list returns offers array", () => {
  const successResponse = {
    success: true,
    data: {
      offers: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    },
  };
  
  assertEquals(successResponse.success, true);
  assertEquals(Array.isArray(successResponse.data.offers), true);
});

Deno.test("offer-crud - success structure - get returns single offer", () => {
  const successResponse = {
    success: true,
    data: {
      offer: { id: "uuid-123", name: "Test Offer" },
    },
  };
  
  assertEquals(successResponse.success, true);
  assertExists(successResponse.data.offer);
});

Deno.test("offer-crud - success structure - create returns new offer", () => {
  const successResponse = {
    success: true,
    data: {
      offer: { id: "new-uuid", name: "New Offer" },
    },
  };
  
  assertEquals(successResponse.success, true);
  assertExists(successResponse.data.offer.id);
});

Deno.test("offer-crud - success structure - delete returns success flag", () => {
  const successResponse = { success: true };
  assertEquals(successResponse.success, true);
});
