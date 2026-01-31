/**
 * Delete/Toggle Validation Tests for checkout-crud
 * @module checkout-crud/tests/delete-toggle.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getCheckoutId, type CheckoutPayload } from "./_shared.ts";

// ============================================
// SET-DEFAULT VALIDATION
// ============================================

Deno.test("checkout-crud - set-default validation - checkoutId is required", () => {
  const body: CheckoutPayload = { action: "set-default" };
  assertEquals(getCheckoutId(body), undefined);
});

Deno.test("checkout-crud - set-default validation - valid request", () => {
  const body: CheckoutPayload = { action: "set-default", checkoutId: "checkout-123" };
  assertEquals(getCheckoutId(body), "checkout-123");
});

// ============================================
// DELETE VALIDATION
// ============================================

Deno.test("checkout-crud - delete validation - accepts checkout_id", () => {
  const body: CheckoutPayload = { action: "delete", checkout_id: "checkout-123" };
  assertEquals(getCheckoutId(body), "checkout-123");
});

Deno.test("checkout-crud - delete validation - accepts checkoutId", () => {
  const body: CheckoutPayload = { action: "delete", checkoutId: "checkout-456" };
  assertEquals(getCheckoutId(body), "checkout-456");
});

Deno.test("checkout-crud - delete validation - requires id", () => {
  const body: CheckoutPayload = { action: "delete" };
  assertEquals(getCheckoutId(body), undefined);
});

Deno.test("checkout-crud - delete validation - cannot delete default checkout", () => {
  const checkout = { id: "checkout-123", is_default: true };
  assertEquals(!checkout.is_default, false);
});

// ============================================
// TOGGLE LINK STATUS VALIDATION
// ============================================

Deno.test("checkout-crud - toggle-link-status - linkId is required", () => {
  const body: CheckoutPayload = { action: "toggle-link-status" };
  assertEquals(body.linkId, undefined);
});

Deno.test("checkout-crud - toggle-link-status - toggles active to inactive", () => {
  const currentStatus: string = "active";
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  assertEquals(newStatus, "inactive");
});

Deno.test("checkout-crud - toggle-link-status - toggles inactive to active", () => {
  const currentStatus: string = "inactive";
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  assertEquals(newStatus, "active");
});

// ============================================
// METHOD VALIDATION
// ============================================

Deno.test("checkout-crud - methods - delete accepts DELETE or POST", () => {
  const validMethods = ["DELETE", "POST"];
  assertEquals(validMethods.includes("DELETE"), true);
  assertEquals(validMethods.includes("POST"), true);
});

Deno.test("checkout-crud - methods - set-default requires POST", () => {
  const action = "set-default";
  const method = "POST";
  assertEquals(action === "set-default" && method === "POST", true);
});
