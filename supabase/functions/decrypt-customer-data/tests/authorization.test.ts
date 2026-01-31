/**
 * Authorization Tests for decrypt-customer-data
 * 
 * @module decrypt-customer-data/tests/authorization.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hasAccess, getAccessType, validateBody } from "./_shared.ts";
import type { Producer } from "./_shared.ts";

// ============================================================================
// REQUEST VALIDATION TESTS
// ============================================================================

Deno.test("RequestBody - should require order_id", () => {
  assertEquals(validateBody({}).valid, false);
  assertEquals(validateBody({ order_id: "" }).valid, false);
  assertEquals(validateBody({ order_id: "uuid-123" }).valid, true);
});

Deno.test("RequestBody - error message format", () => {
  const result = validateBody({});
  assertEquals(result.error, "order_id required");
});

// ============================================================================
// AUTHORIZATION TESTS
// ============================================================================

Deno.test("Authorization - product owner should have access", () => {
  const producer: Producer = { id: "user-123", role: "vendor" };
  
  assertEquals(hasAccess(producer, "user-123"), true); // Same user
  assertEquals(hasAccess(producer, "user-456"), false); // Different user
});

Deno.test("Authorization - platform owner should have access", () => {
  const owner: Producer = { id: "admin-1", role: "owner" };
  
  assertEquals(hasAccess(owner, "user-123"), true); // Owner can access any
  assertEquals(hasAccess(owner, "user-456"), true);
});

Deno.test("Authorization - affiliate should not have access", () => {
  const affiliate: Producer = { id: "affiliate-1", role: "affiliate" };
  
  assertEquals(hasAccess(affiliate, "user-123"), false);
});

Deno.test("Authorization - vendor accessing other's product denied", () => {
  const vendor: Producer = { id: "vendor-1", role: "vendor" };
  
  assertEquals(hasAccess(vendor, "vendor-2"), false);
});

// ============================================================================
// ACCESS TYPE TESTS
// ============================================================================

Deno.test("Access type - should determine correctly", () => {
  assertEquals(getAccessType(true, false), "vendor");
  assertEquals(getAccessType(false, true), "admin");
  assertEquals(getAccessType(true, true), "vendor"); // Product owner takes precedence
  assertEquals(getAccessType(false, false), null);
});
