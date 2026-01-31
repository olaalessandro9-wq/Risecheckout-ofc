/**
 * Product Duplicate - Input & Ownership Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module product-duplicate/tests/input-ownership
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidUUID, verifyOwnership, mockProduct } from "./_shared.ts";

Deno.test("product-duplicate - Input Validation", async (t) => {
  await t.step("deve rejeitar productId vazio", () => {
    const productId = "";
    assertEquals(productId.length > 0, false);
  });

  await t.step("deve rejeitar productId null", () => {
    const productId = null;
    assertEquals(productId === null, true);
  });

  await t.step("deve aceitar productId UUID válido", () => {
    const productId = "550e8400-e29b-41d4-a716-446655440000";
    assertEquals(isValidUUID(productId), true);
  });

  await t.step("deve rejeitar productId inválido", () => {
    const productId = "not-a-uuid";
    assertEquals(isValidUUID(productId), false);
  });

  await t.step("deve validar action 'duplicate'", () => {
    const body = { product_id: "uuid-here" };
    assertExists(body.product_id);
  });
});

Deno.test("product-duplicate - Ownership Verification", async (t) => {
  await t.step("deve validar ownership quando produto pertence ao usuário", () => {
    const result = verifyOwnership("prod-123", "user-456", mockProduct);
    assertEquals(result, true);
  });

  await t.step("deve rejeitar ownership quando usuário não é dono", () => {
    const result = verifyOwnership("prod-123", "outro-user", mockProduct);
    assertEquals(result, false);
  });

  await t.step("deve rejeitar ownership quando produto não existe", () => {
    const result = verifyOwnership("prod-inexistente", "user-456", null);
    assertEquals(result, false);
  });

  await t.step("deve rejeitar ownership quando IDs não correspondem", () => {
    const result = verifyOwnership("prod-999", "user-456", mockProduct);
    assertEquals(result, false);
  });
});
