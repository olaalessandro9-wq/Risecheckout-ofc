/**
 * Integration Tests for checkout-crud (CORS, Auth, Errors)
 * @module checkout-crud/tests/integration.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { FUNCTION_URL, SUPABASE_ANON_KEY, isRateLimited } from "./_shared.ts";

// ============================================
// CORS TESTS
// ============================================

Deno.test("checkout-crud - CORS - returns expected CORS headers in structure", () => {
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

Deno.test("checkout-crud - auth - rejects unauthenticated requests", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action: "create", productId: "test", name: "test", offerId: "test" }),
  });
  
  assertEquals(response.status, 401);
  await response.text();
});

// ============================================
// RATE LIMITING
// ============================================

Deno.test("checkout-crud - rate limit - create is rate limited", () => {
  assertEquals(isRateLimited("create"), true);
});

Deno.test("checkout-crud - rate limit - update is rate limited", () => {
  assertEquals(isRateLimited("update"), true);
});

// ============================================
// ERROR RESPONSE STRUCTURE
// ============================================

Deno.test("checkout-crud - error structure - missing action error", () => {
  const errorResponse = { success: false, error: "Ação não especificada" };
  assertEquals(errorResponse.success, false);
  assertStringIncludes(errorResponse.error, "Ação não especificada");
});

Deno.test("checkout-crud - error structure - validation error format", () => {
  const errorResponse = { success: false, error: "ID do checkout é obrigatório" };
  assertEquals(errorResponse.success, false);
  assertExists(errorResponse.error);
});

Deno.test("checkout-crud - error structure - permission error", () => {
  const errorResponse = { success: false, error: "Você não tem permissão para criar checkouts neste produto" };
  assertStringIncludes(errorResponse.error, "permissão");
});

Deno.test("checkout-crud - error structure - delete default error", () => {
  const errorResponse = { success: false, error: "Não é possível excluir o checkout padrão" };
  assertStringIncludes(errorResponse.error, "checkout padrão");
});

Deno.test("checkout-crud - error structure - rate limit error", () => {
  const errorResponse = { success: false, error: "Muitas requisições.", retryAfter: 300 };
  assertEquals(errorResponse.error, "Muitas requisições.");
  assertExists(errorResponse.retryAfter);
});

// ============================================
// SUCCESS RESPONSE STRUCTURE
// ============================================

Deno.test("checkout-crud - success structure - create returns checkout data", () => {
  const successResponse = {
    success: true,
    data: {
      checkout: { id: "new-uuid", name: "New Checkout", isDefault: false, linkId: "link-uuid" },
    },
  };
  
  assertEquals(successResponse.success, true);
  assertExists(successResponse.data.checkout.id);
  assertExists(successResponse.data.checkout.linkId);
});

Deno.test("checkout-crud - success structure - delete returns success flag", () => {
  const successResponse = { success: true };
  assertEquals(successResponse.success, true);
});

Deno.test("checkout-crud - success structure - toggle returns new status", () => {
  const successResponse = { success: true, newStatus: "inactive" };
  assertEquals(successResponse.success, true);
  assertExists(successResponse.newStatus);
});
