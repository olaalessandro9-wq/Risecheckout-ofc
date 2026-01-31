/**
 * Buyer Profile - Profile Operations Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module buyer-profile/tests/profile-operations
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mockBuyerProfile, mockUpdatePayload, mergeProfileUpdate, type UpdateProfilePayload } from "./_shared.ts";

Deno.test("buyer-profile - Profile Operations", async (t) => {
  await t.step("should merge update with existing profile", () => {
    const updated = mergeProfileUpdate(mockBuyerProfile, mockUpdatePayload);
    
    assertEquals(updated.name, "João da Silva");
    assertEquals(updated.phone, "+5511888887777");
    assertEquals(updated.email, mockBuyerProfile.email);
    assertEquals(updated.id, mockBuyerProfile.id);
  });

  await t.step("should preserve fields not in update", () => {
    const partialUpdate: UpdateProfilePayload = { name: "Novo Nome" };
    const updated = mergeProfileUpdate(mockBuyerProfile, partialUpdate);
    
    assertEquals(updated.name, "Novo Nome");
    assertEquals(updated.phone, mockBuyerProfile.phone);
    assertEquals(updated.avatar_url, mockBuyerProfile.avatar_url);
  });

  await t.step("should handle empty update payload", () => {
    const updated = mergeProfileUpdate(mockBuyerProfile, {});
    
    assertEquals(updated.name, mockBuyerProfile.name);
    assertEquals(updated.phone, mockBuyerProfile.phone);
  });

  await t.step("should sanitize name in update", () => {
    const dirtyUpdate: UpdateProfilePayload = { name: "  Nome   Sujo  " };
    const updated = mergeProfileUpdate(mockBuyerProfile, dirtyUpdate);
    
    assertEquals(updated.name, "Nome Sujo");
  });
});
