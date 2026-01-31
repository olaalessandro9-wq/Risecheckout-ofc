/**
 * Update Price Tests for product-settings
 * 
 * @module product-settings/tests/update-price.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidPrice } from "./_shared.ts";

// ============================================================================
// UPDATE PRICE TESTS
// ============================================================================

Deno.test("product-settings - Update Price - should accept positive integer", () => {
  assertEquals(isValidPrice(9700), true);
});

Deno.test("product-settings - Update Price - should reject zero", () => {
  assertEquals(isValidPrice(0), false);
});

Deno.test("product-settings - Update Price - should reject negative", () => {
  assertEquals(isValidPrice(-100), false);
});

Deno.test("product-settings - Update Price - should reject decimal", () => {
  assertEquals(isValidPrice(97.50), false);
});

Deno.test("product-settings - Update Price - should reject string", () => {
  assertEquals(isValidPrice("9700"), false);
});

Deno.test("product-settings - Update Price - should reject null", () => {
  assertEquals(isValidPrice(null), false);
});
