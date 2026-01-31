/**
 * Product Extraction Tests for decrypt-customer-data
 * 
 * @module decrypt-customer-data/tests/product-extraction.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { extractProductOwner } from "./_shared.ts";
import type { ProductRecord } from "./_shared.ts";

// ============================================================================
// PRODUCT EXTRACTION TESTS
// ============================================================================

Deno.test("Product extraction - should handle single product", () => {
  const single: ProductRecord = { id: "prod-1", user_id: "user-123" };
  
  assertEquals(extractProductOwner(single), "user-123");
});

Deno.test("Product extraction - should handle product array", () => {
  const array: ProductRecord[] = [{ id: "prod-1", user_id: "user-123" }];
  
  assertEquals(extractProductOwner(array), "user-123");
});

Deno.test("Product extraction - should handle null product", () => {
  assertEquals(extractProductOwner(null), null);
});

Deno.test("Product extraction - should use first from array", () => {
  const array: ProductRecord[] = [
    { id: "prod-1", user_id: "user-123" },
    { id: "prod-2", user_id: "user-456" }
  ];
  
  assertEquals(extractProductOwner(array), "user-123");
});

Deno.test("Product extraction - empty array returns null", () => {
  const empty: ProductRecord[] = [];
  
  assertEquals(extractProductOwner(empty), null);
});
