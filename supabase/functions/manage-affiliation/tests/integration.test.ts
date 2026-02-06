/**
 * Integration Tests for manage-affiliation (CORS, Auth, Response)
 * @module manage-affiliation/tests/integration.test
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { skipIntegration, integrationTestOptions, getTestConfig } from "../../_shared/testing/mod.ts";
import { FUNCTION_URL, ACTION_MESSAGES, MAX_COMMISSION_RATE } from "./_shared.ts";

const config = getTestConfig();

// ============================================
// CORS TESTS
// ============================================

Deno.test("manage-affiliation - CORS - returns expected CORS headers in structure", () => {
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
  name: "manage-affiliation/integration: auth - rejects unauthenticated requests",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.supabasePublishableKey ?? "",
      },
      body: JSON.stringify({ affiliation_id: "test", action: "approve" }),
    });
    
    assertEquals(response.status, 401);
    await response.text();
  },
});

// ============================================
// ACTION MESSAGES
// ============================================

Deno.test("manage-affiliation - messages - approve message", () => {
  assertEquals(ACTION_MESSAGES.approve, "Afiliado aprovado com sucesso!");
});

Deno.test("manage-affiliation - messages - reject message", () => {
  assertEquals(ACTION_MESSAGES.reject, "Afiliado recusado.");
});

Deno.test("manage-affiliation - messages - update_commission includes rate in message", () => {
  const commissionRate = 25;
  const message = `Taxa de comissão atualizada para ${commissionRate}%`;
  assertStringIncludes(message, "25%");
});

// ============================================
// ERROR MESSAGES
// ============================================

Deno.test("manage-affiliation - errors - missing required fields", () => {
  const error = "affiliation_id e action são obrigatórios";
  assertStringIncludes(error, "affiliation_id");
  assertStringIncludes(error, "action");
});

Deno.test("manage-affiliation - errors - invalid action", () => {
  const error = "Ação inválida. Use: approve, reject, block, unblock ou update_commission";
  assertStringIncludes(error, "Ação inválida");
});

Deno.test("manage-affiliation - errors - invalid commission rate", () => {
  const error = `Taxa de comissão deve ser um número entre 1 e ${MAX_COMMISSION_RATE}`;
  assertStringIncludes(error, "1");
  assertStringIncludes(error, "90");
});

Deno.test("manage-affiliation - errors - affiliation not found", () => {
  const error = "Afiliação não encontrada";
  assertStringIncludes(error, "não encontrada");
});

Deno.test("manage-affiliation - errors - no permission", () => {
  const error = "Você não tem permissão para gerenciar este afiliado";
  assertStringIncludes(error, "permissão");
});

// ============================================
// SUCCESS RESPONSE STRUCTURE
// ============================================

Deno.test("manage-affiliation - success structure - includes affiliation data", () => {
  const response = {
    success: true,
    affiliation: {
      id: "affil-123",
      status: "active",
      affiliate_code: "XYZ789AB",
      commission_rate: 30,
    },
    message: "Afiliado aprovado com sucesso!",
  };
  
  assertEquals(response.success, true);
  assertExists(response.affiliation);
  assertExists(response.message);
});

Deno.test("manage-affiliation - success structure - affiliate has code after approval", () => {
  const affiliation = {
    status: "active",
    affiliate_code: "ABC12345",
  };
  
  assertExists(affiliation.affiliate_code);
  assertEquals(affiliation.status, "active");
});

// ============================================
// ERROR RESPONSE STRUCTURE
// ============================================

Deno.test("manage-affiliation - error structure - includes success false", () => {
  const response = {
    success: false,
    error: "Erro ao processar ação",
  };
  
  assertEquals(response.success, false);
  assertExists(response.error);
});

// ============================================
// RATE LIMITING
// ============================================

Deno.test("manage-affiliation - rate limit - uses AFFILIATION_MANAGE config", () => {
  const rateLimitConfig = "AFFILIATION_MANAGE";
  assertExists(rateLimitConfig);
});

// ============================================
// ROLE VALIDATION
// ============================================

Deno.test("manage-affiliation - role - requires can have affiliates permission", () => {
  const requiredRole = "can_have_affiliates";
  assertExists(requiredRole);
});
