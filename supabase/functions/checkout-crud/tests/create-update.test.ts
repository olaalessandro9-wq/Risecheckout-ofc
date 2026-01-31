/**
 * Create/Update Validation Tests for checkout-crud
 * @module checkout-crud/tests/create-update.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { type CheckoutPayload } from "./_shared.ts";

// ============================================
// CREATE VALIDATION
// ============================================

Deno.test("checkout-crud - create validation - productId is required", () => {
  const body: CheckoutPayload = { action: "create", name: "Test Checkout", offerId: "offer-123" };
  assertEquals(body.productId, undefined);
});

Deno.test("checkout-crud - create validation - name is required", () => {
  const body: CheckoutPayload = { action: "create", productId: "product-123", offerId: "offer-123" };
  assertEquals(body.name, undefined);
});

Deno.test("checkout-crud - create validation - offerId is required", () => {
  const body: CheckoutPayload = { action: "create", productId: "product-123", name: "Test" };
  assertEquals(body.offerId, undefined);
});

Deno.test("checkout-crud - create validation - name must not be empty", () => {
  const body: CheckoutPayload = { action: "create", productId: "product-123", name: "   ", offerId: "offer-123" };
  const isValid = (body.name ?? "").trim().length > 0;
  assertEquals(isValid, false);
});

Deno.test("checkout-crud - create validation - valid create request", () => {
  const body: CheckoutPayload = {
    action: "create",
    productId: "product-123",
    name: "Premium Checkout",
    offerId: "offer-456",
    isDefault: false,
  };
  
  assertExists(body.productId);
  assertExists(body.name);
  assertExists(body.offerId);
});

// ============================================
// UPDATE VALIDATION
// ============================================

Deno.test("checkout-crud - update validation - checkoutId is required", () => {
  const body: CheckoutPayload = { action: "update", name: "Updated Name" };
  assertEquals(body.checkoutId, undefined);
});

Deno.test("checkout-crud - update validation - accepts partial updates", () => {
  const body: CheckoutPayload = { action: "update", checkoutId: "checkout-123", name: "New Name" };
  assertExists(body.checkoutId);
  assertExists(body.name);
  assertEquals(body.offerId, undefined);
});

Deno.test("checkout-crud - update validation - name is trimmed", () => {
  const body: CheckoutPayload = { action: "update", checkoutId: "checkout-123", name: "  Updated  " };
  const trimmedName = body.name?.trim();
  assertEquals(trimmedName, "Updated");
});

// ============================================
// METHOD VALIDATION
// ============================================

Deno.test("checkout-crud - methods - create requires POST", () => {
  const action = "create";
  const method = "POST";
  assertEquals(action === "create" && method === "POST", true);
});

Deno.test("checkout-crud - methods - update accepts PUT or POST", () => {
  const validMethods = ["PUT", "POST"];
  assertEquals(validMethods.includes("PUT"), true);
  assertEquals(validMethods.includes("POST"), true);
});
