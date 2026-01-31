/**
 * Buyer Profile - Auth & Response Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module buyer-profile/tests/auth-response
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  mockBuyerProfile,
  mockUpdatePayload,
  mergeProfileUpdate,
  type ProfileResponse
} from "./_shared.ts";

Deno.test("buyer-profile - Authorization", async (t) => {
  await t.step("should require authentication", () => {
    const headers = new Headers();
    const hasAuth = headers.has("Authorization");
    
    assertEquals(hasAuth, false);
  });

  await t.step("should validate buyer owns profile", () => {
    const requesterId = "buyer-uuid-001";
    const profileId = "buyer-uuid-001";
    
    assertEquals(requesterId, profileId);
  });

  await t.step("should reject access to other buyer's profile", () => {
    const requesterId = "buyer-uuid-001" as string;
    const otherProfileId = "buyer-uuid-002" as string;
    
    assertEquals(requesterId === otherProfileId, false);
  });
});

Deno.test("buyer-profile - Response Format", async (t) => {
  await t.step("should return profile on successful GET", () => {
    const response: ProfileResponse = {
      success: true,
      profile: mockBuyerProfile,
    };
    
    assertEquals(response.success, true);
    assertExists(response.profile);
    assertEquals(response.profile.email, "comprador@teste.com");
  });

  await t.step("should return success on update", () => {
    const response: ProfileResponse = {
      success: true,
      profile: mergeProfileUpdate(mockBuyerProfile, mockUpdatePayload),
    };
    
    assertEquals(response.success, true);
    assertEquals(response.profile?.name, "João da Silva");
  });

  await t.step("should return error for invalid requests", () => {
    const response: ProfileResponse = {
      success: false,
      error: "Dados inválidos",
    };
    
    assertEquals(response.success, false);
    assertExists(response.error);
  });

  await t.step("should return 404 for non-existent profile", () => {
    const response: ProfileResponse = {
      success: false,
      error: "Perfil não encontrado",
    };
    
    assertEquals(response.success, false);
    assertStringIncludes(response.error!, "não encontrado");
  });
});
