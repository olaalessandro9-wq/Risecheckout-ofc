/**
 * Content Library - Ownership Verification Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module content-library/tests/ownership
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { verifyProductOwnership } from "./_shared.ts";

Deno.test("content-library - Ownership Verification", async (t) => {
  await t.step("deve aprovar quando produtor é dono do produto", () => {
    const result = verifyProductOwnership("prod-1", "user-123");
    assertEquals(result, true);
  });

  await t.step("deve negar quando produtor não é dono", () => {
    const result = verifyProductOwnership("prod-1", "user-456");
    assertEquals(result, false);
  });

  await t.step("deve negar quando produto não existe", () => {
    const result = verifyProductOwnership("prod-inexistente", "user-123");
    assertEquals(result, false);
  });
});
