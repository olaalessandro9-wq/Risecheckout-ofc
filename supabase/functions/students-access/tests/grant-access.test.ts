/**
 * Grant Access Tests for students-access
 * 
 * @module students-access/tests/grant-access.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validateAccessRequest,
  buildAccessRecord,
  MOCK_GRANT_REQUEST,
  MOCK_BUYER_ID,
  MOCK_PRODUCT_ID,
  MOCK_ORDER_ID,
} from "./_shared.ts";

// ============================================================================
// GRANT ACCESS VALIDATION TESTS
// ============================================================================

Deno.test("students-access - Grant Access - should accept valid grant-access request", () => {
  const error = validateAccessRequest(MOCK_GRANT_REQUEST);
  assertEquals(error, null);
});

Deno.test("students-access - Grant Access - should reject grant request without buyer_id", () => {
  const error = validateAccessRequest({
    action: "grant-access",
    buyer_id: "",
    product_id: MOCK_PRODUCT_ID,
  });
  assertExists(error);
  assertEquals(error, "buyer_id and product_id required");
});

Deno.test("students-access - Grant Access - should reject grant request without product_id", () => {
  const error = validateAccessRequest({
    action: "grant-access",
    buyer_id: MOCK_BUYER_ID,
    product_id: "",
  });
  assertExists(error);
  assertEquals(error, "buyer_id and product_id required");
});

// ============================================================================
// ACCESS RECORD BUILDING TESTS
// ============================================================================

Deno.test("students-access - Grant Access - should build access record with order_id", () => {
  const record = buildAccessRecord(MOCK_BUYER_ID, MOCK_PRODUCT_ID, MOCK_ORDER_ID);

  assertEquals(record.buyer_id, MOCK_BUYER_ID);
  assertEquals(record.product_id, MOCK_PRODUCT_ID);
  assertEquals(record.order_id, MOCK_ORDER_ID);
  assertEquals(record.is_active, true);
  assertEquals(record.access_type, "invite");
  assertExists(record.granted_at);
});

Deno.test("students-access - Grant Access - should build access record without order_id", () => {
  const record = buildAccessRecord(MOCK_BUYER_ID, MOCK_PRODUCT_ID);

  assertEquals(record.buyer_id, MOCK_BUYER_ID);
  assertEquals(record.product_id, MOCK_PRODUCT_ID);
  assertEquals(record.order_id, null);
  assertEquals(record.is_active, true);
});

Deno.test("students-access - Grant Access - should set access_type to 'invite'", () => {
  const record = buildAccessRecord(MOCK_BUYER_ID, MOCK_PRODUCT_ID);
  assertEquals(record.access_type, "invite");
});

Deno.test("students-access - Grant Access - should include ISO timestamp for granted_at", () => {
  const record = buildAccessRecord(MOCK_BUYER_ID, MOCK_PRODUCT_ID);
  const grantedAt = record.granted_at as string;
  
  // Validate ISO format
  const date = new Date(grantedAt);
  assertEquals(isNaN(date.getTime()), false);
});
