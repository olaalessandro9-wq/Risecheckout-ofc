/**
 * Authorization Tests for decrypt-customer-data-batch
 * 
 * @module decrypt-customer-data-batch/tests/authorization.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hasAccess, getProductOwnerId } from "./_shared.ts";
import type { Producer, OrderWithProduct } from "./_shared.ts";

// ============================================================================
// AUTHORIZATION TESTS
// ============================================================================

Deno.test("Authorization - only product owner has batch access", () => {
  const vendor: Producer = { id: "user-123", role: "vendor" };
  const owner: Producer = { id: "admin-1", role: "owner" };

  assertEquals(hasAccess(vendor, "user-123"), true);
  assertEquals(hasAccess(vendor, "user-456"), false);
  assertEquals(hasAccess(owner, "user-123"), false); // Owner uses individual endpoint
});

Deno.test("Authorization - different vendor denied", () => {
  const vendor: Producer = { id: "vendor-1", role: "vendor" };
  assertEquals(hasAccess(vendor, "vendor-2"), false);
});

// ============================================================================
// ORDER WITH PRODUCT TYPE TESTS
// ============================================================================

Deno.test("OrderWithProduct - should extract product owner", () => {
  const withSingle: OrderWithProduct = {
    id: "order-1",
    customer_phone: null,
    customer_document: null,
    product: { id: "prod-1", user_id: "user-123" }
  };

  const withArray: OrderWithProduct = {
    id: "order-2",
    customer_phone: null,
    customer_document: null,
    product: [{ id: "prod-1", user_id: "user-456" }]
  };

  const withNull: OrderWithProduct = {
    id: "order-3",
    customer_phone: null,
    customer_document: null,
    product: null
  };

  assertEquals(getProductOwnerId(withSingle), "user-123");
  assertEquals(getProductOwnerId(withArray), "user-456");
  assertEquals(getProductOwnerId(withNull), null);
});
