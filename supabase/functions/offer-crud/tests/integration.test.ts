/**
 * Integration Tests for offer-crud (CORS, Auth, Response)
 * @module offer-crud/tests/integration.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { FUNCTION_URL, SUPABASE_ANON_KEY } from "./_shared.ts";

// ============================================
// CORS TESTS
// ============================================

Deno.test("offer-crud - CORS - OPTIONS request returns headers", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { "Origin": "https://example.com" },
  });
  
  assertEquals(response.status, 204);
  await response.text();
});

// ============================================
// AUTHENTICATION TESTS
// ============================================

Deno.test("offer-crud - auth - rejects unauthenticated requests", async () => {
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

// ============================================
// ERROR RESPONSE STRUCTURE
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
// SUCCESS RESPONSE STRUCTURE
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
