/**
 * Input Validation Tests for decrypt-customer-data-batch
 * 
 * @module decrypt-customer-data-batch/tests/input-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  validateRequest, 
  validateLimit, 
  validateOrderIds,
  getFields,
  MAX_ORDER_IDS 
} from "./_shared.ts";

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

Deno.test("Constants - MAX_ORDER_IDS should be 20", () => {
  assertEquals(MAX_ORDER_IDS, 20);
});

// ============================================================================
// INPUT VALIDATION TESTS
// ============================================================================

Deno.test("Input validation - should require order_ids array", () => {
  assertEquals(validateRequest({}).valid, false);
  assertEquals(validateRequest({ order_ids: [] }).valid, false);
  assertEquals(validateRequest({ order_ids: ["id-1"] }).valid, true);
});

Deno.test("Input validation - should enforce MAX_ORDER_IDS limit", () => {
  const under = new Array(10).fill("id");
  const exact = new Array(20).fill("id");
  const over = new Array(21).fill("id");

  assertEquals(validateLimit(under).valid, true);
  assertEquals(validateLimit(exact).valid, true);
  assertEquals(validateLimit(over).valid, false);
});

Deno.test("Input validation - limit error includes max", () => {
  const over = new Array(21).fill("id");
  const result = validateLimit(over);
  assertEquals(result.error?.includes("20"), true);
});

Deno.test("Input validation - default fields should include customer_phone", () => {
  assertEquals(getFields(undefined), ["customer_phone"]);
  assertEquals(getFields(["customer_email"]), ["customer_email"]);
});

Deno.test("Input validation - invalid order_ids type", () => {
  assertEquals(validateOrderIds(null).valid, false);
  assertEquals(validateOrderIds("string").valid, false);
  assertEquals(validateOrderIds({}).valid, false);
  assertEquals(validateOrderIds([]).valid, false);
  assertEquals(validateOrderIds(["id"]).valid, true);
});
