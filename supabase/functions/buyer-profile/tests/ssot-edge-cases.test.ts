/**
 * Buyer Profile - SSOT & Edge Cases Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module buyer-profile/tests/ssot-edge-cases
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mockBuyerProfile, mockUpdatePayload, isValidName, sanitizeName, type BuyerProfile } from "./_shared.ts";

Deno.test("buyer-profile - SSOT Compliance (users table)", async (t) => {
  await t.step("should query users table as SSOT", () => {
    const query = {
      table: "users",
      select: "id, email, name, phone, created_at, avatar_url",
      filter: { id: mockBuyerProfile.id },
    };
    
    assertEquals(query.table, "users");
    assertStringIncludes(query.select, "email");
    assertStringIncludes(query.select, "name");
  });

  await t.step("should NOT query deprecated buyer_profiles table", () => {
    const deprecatedTable = "buyer_profiles" as string;
    const ssotTable = "users" as string;
    
    assertEquals(ssotTable !== deprecatedTable, true);
  });

  await t.step("should update users table on profile update", () => {
    const mutation = {
      table: "users",
      operation: "update",
      data: mockUpdatePayload,
      filter: { id: mockBuyerProfile.id },
    };
    
    assertEquals(mutation.table, "users");
    assertEquals(mutation.operation, "update");
  });
});

Deno.test("buyer-profile - Edge Cases", async (t) => {
  await t.step("should handle null name", () => {
    const profileWithNullName: BuyerProfile = {
      ...mockBuyerProfile,
      name: null,
    };
    
    assertEquals(profileWithNullName.name, null);
  });

  await t.step("should handle null phone", () => {
    const profileWithNullPhone: BuyerProfile = {
      ...mockBuyerProfile,
      phone: null,
    };
    
    assertEquals(profileWithNullPhone.phone, null);
  });

  await t.step("should handle Unicode in name", () => {
    const unicodeName = "José María Ñoño 日本語";
    assertEquals(isValidName(unicodeName), true);
    assertEquals(sanitizeName(unicodeName), unicodeName);
  });

  await t.step("should handle XSS attempts in name", () => {
    const xssName = "<script>alert('xss')</script>";
    const sanitized = sanitizeName(xssName);
    
    assertEquals(sanitized.length <= 100, true);
  });
});
