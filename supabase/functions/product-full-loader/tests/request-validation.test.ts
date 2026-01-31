/**
 * Request Validation Tests for product-full-loader
 * 
 * @module product-full-loader/tests/request-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validateRequest,
  MOCK_VALID_REQUEST,
  MOCK_INVALID_ACTION_REQUEST,
  MOCK_PRODUCT_ID,
} from "./_shared.ts";

// ============================================================================
// REQUEST VALIDATION TESTS
// ============================================================================

Deno.test("product-full-loader - Request Validation - should accept valid load-full action", () => {
  const error = validateRequest(MOCK_VALID_REQUEST);
  assertEquals(error, null);
});

Deno.test("product-full-loader - Request Validation - should reject invalid action", () => {
  const error = validateRequest(MOCK_INVALID_ACTION_REQUEST);
  assertExists(error);
  assertEquals(error, "Invalid action");
});

Deno.test("product-full-loader - Request Validation - should reject missing productId", () => {
  const error = validateRequest({
    action: "load-full",
    productId: "",
  });
  assertExists(error);
  assertEquals(error, "productId is required");
});

Deno.test("product-full-loader - Request Validation - should reject null productId", () => {
  const error = validateRequest({
    action: "load-full",
    productId: null as unknown as string,
  });
  assertExists(error);
});

Deno.test("product-full-loader - Request Validation - should accept valid UUID as productId", () => {
  const error = validateRequest({
    action: "load-full",
    productId: MOCK_PRODUCT_ID,
  });
  assertEquals(error, null);
});
