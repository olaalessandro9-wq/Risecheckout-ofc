/**
 * Action & Product ID Validation Tests for marketplace-public
 * 
 * @module marketplace-public/tests/validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateAction, validateProductId } from "./_shared.ts";

// ============================================================================
// ACTION VALIDATION TESTS
// ============================================================================

Deno.test("marketplace-public - Validation - valid actions pass", () => {
  assertEquals(validateAction("get-products"), true);
  assertEquals(validateAction("get-product"), true);
  assertEquals(validateAction("get-categories"), true);
});

Deno.test("marketplace-public - Validation - invalid action fails", () => {
  assertEquals(validateAction("invalid"), false);
  assertEquals(validateAction(""), false);
  assertEquals(validateAction(null), false);
  assertEquals(validateAction(undefined), false);
});

// ============================================================================
// PRODUCT ID VALIDATION TESTS
// ============================================================================

Deno.test("marketplace-public - Product ID - valid ID passes", () => {
  assertEquals(validateProductId("prod-123"), true);
  assertEquals(validateProductId("abc"), true);
});

Deno.test("marketplace-public - Product ID - invalid ID fails", () => {
  assertEquals(validateProductId(""), false);
  assertEquals(validateProductId(null), false);
  assertEquals(validateProductId(undefined), false);
  assertEquals(validateProductId(123), false);
});
