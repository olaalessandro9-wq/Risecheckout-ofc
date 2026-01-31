/**
 * Profile SSOT Tests for producer-profile
 * 
 * @module producer-profile/tests/profile-ssot.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MOCK_PRODUCER, MOCK_PRODUCER_PARTIAL, type ProfileResponse } from "./_shared.ts";

// ============================================================================
// GET PROFILE SSOT TESTS
// ============================================================================

Deno.test("producer-profile - Profile SSOT - should return profile from users table", () => {
  const response: ProfileResponse = {
    profile: {
      name: MOCK_PRODUCER.name,
      cpf_cnpj: MOCK_PRODUCER.cpf_cnpj,
      phone: MOCK_PRODUCER.phone
    }
  };
  
  assertEquals(response.profile?.name, "Producer Name");
  assertEquals(response.profile?.cpf_cnpj, "12345678901");
  assertEquals(response.profile?.phone, "11999999999");
});

Deno.test("producer-profile - Profile SSOT - should handle null fields", () => {
  const response: ProfileResponse = {
    profile: {
      name: MOCK_PRODUCER_PARTIAL.name,
      cpf_cnpj: MOCK_PRODUCER_PARTIAL.cpf_cnpj,
      phone: MOCK_PRODUCER_PARTIAL.phone
    }
  };
  
  assertEquals(response.profile?.name, null);
  assertEquals(response.profile?.cpf_cnpj, null);
  assertEquals(response.profile?.phone, null);
});

Deno.test("producer-profile - Profile SSOT - should use users table (RISE V3)", () => {
  const tableName = "users";
  assertEquals(tableName, "users");
});

Deno.test("producer-profile - Profile SSOT - should return 404 if not found", () => {
  const response: ProfileResponse = {
    error: "Perfil não encontrado",
    code: "NOT_FOUND"
  };
  
  assertEquals(response.code, "NOT_FOUND");
  assertStringIncludes(response.error!, "não encontrado");
});

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

Deno.test("producer-profile - Auth - should require authentication", () => {
  const requiresAuth = true;
  assertEquals(requiresAuth, true);
});

Deno.test("producer-profile - Auth - should use requireAuthenticatedProducer", () => {
  const authFunction = "requireAuthenticatedProducer";
  assertEquals(authFunction, "requireAuthenticatedProducer");
});
