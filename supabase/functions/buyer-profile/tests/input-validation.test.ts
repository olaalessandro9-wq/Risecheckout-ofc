/**
 * Buyer Profile - Input Validation Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module buyer-profile/tests/input-validation
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidPhone, isValidName, sanitizeName, isValidAvatarUrl } from "./_shared.ts";

Deno.test("buyer-profile - Input Validation", async (t) => {
  await t.step("should validate Brazilian phone format", () => {
    assertEquals(isValidPhone("+5511999998888"), true);
    assertEquals(isValidPhone("+551199999888"), true);
    assertEquals(isValidPhone("+5511999998888"), true);
    assertEquals(isValidPhone("11999998888"), false);
    assertEquals(isValidPhone("+1234567890"), false);
    assertEquals(isValidPhone(""), false);
  });

  await t.step("should validate name length", () => {
    assertEquals(isValidName("Jo"), true);
    assertEquals(isValidName("J"), false);
    assertEquals(isValidName("A".repeat(100)), true);
    assertEquals(isValidName("A".repeat(101)), false);
    assertEquals(isValidName("  "), false);
  });

  await t.step("should sanitize name input", () => {
    assertEquals(sanitizeName("  João  Silva  "), "João Silva");
    assertEquals(sanitizeName("A".repeat(150)), "A".repeat(100));
    assertEquals(sanitizeName("Nome\n\tEstranho"), "Nome Estranho");
  });

  await t.step("should validate avatar URL", () => {
    assertEquals(isValidAvatarUrl("https://storage.example.com/avatar.jpg"), true);
    assertEquals(isValidAvatarUrl("http://example.com/img.png"), true);
    assertEquals(isValidAvatarUrl("ftp://invalid.com/file"), false);
    assertEquals(isValidAvatarUrl("not-a-url"), false);
    assertEquals(isValidAvatarUrl(""), false);
  });

  await t.step("should reject invalid update payloads", () => {
    const invalidPayloads = [
      { name: "" },
      { name: "A" },
      { phone: "123" },
      { avatar_url: "invalid-url" },
    ];

    for (const payload of invalidPayloads) {
      const isValid =
        (payload.name === undefined || isValidName(payload.name)) &&
        (payload.phone === undefined || isValidPhone(payload.phone)) &&
        (payload.avatar_url === undefined || isValidAvatarUrl(payload.avatar_url));
      
      assertEquals(isValid, false);
    }
  });
});
