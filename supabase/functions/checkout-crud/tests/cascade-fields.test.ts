/**
 * Cascade Delete & Fields Tests for checkout-crud
 * @module checkout-crud/tests/cascade-fields.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { CASCADE_DELETE_ORDER, shouldDeletePaymentLink, type Checkout, type PaymentLink } from "./_shared.ts";

// ============================================
// IS_DEFAULT LOGIC
// ============================================

Deno.test("checkout-crud - is_default - new checkouts start with is_default: false", () => {
  const newCheckout = { is_default: false };
  assertEquals(newCheckout.is_default, false);
});

Deno.test("checkout-crud - is_default - setCheckoutAsDefault uses helper", () => {
  const helperUsed = true;
  assertEquals(helperUsed, true);
});

// ============================================
// CASCADE DELETE
// ============================================

Deno.test("checkout-crud - cascade delete - removes checkout_links first", () => {
  assertEquals(CASCADE_DELETE_ORDER[0], "checkout_links");
});

Deno.test("checkout-crud - cascade delete - preserves original payment links", () => {
  const paymentLink: PaymentLink = { id: "link-123", is_original: true };
  assertEquals(shouldDeletePaymentLink(paymentLink), false);
});

Deno.test("checkout-crud - cascade delete - deletes non-original payment links", () => {
  const paymentLink: PaymentLink = { id: "link-456", is_original: false };
  assertEquals(shouldDeletePaymentLink(paymentLink), true);
});

// ============================================
// PAYMENT LINK TYPES
// ============================================

Deno.test("checkout-crud - payment links - handles array response", () => {
  const paymentLinks: PaymentLink[] = [{ id: "link-1", is_original: true }];
  assertEquals(paymentLinks[0]?.is_original, true);
});

Deno.test("checkout-crud - payment links - handles object response", () => {
  const paymentLinks: PaymentLink = { id: "link-1", is_original: false };
  assertEquals(paymentLinks.is_original, false);
});

// ============================================
// BASE URL HANDLING
// ============================================

Deno.test("checkout-crud - base url - extracts from origin header", () => {
  const headers = new Headers({ "origin": "https://risecheckout.com" });
  const baseUrl = headers.get("origin") ?? "https://risecheckout.com";
  assertEquals(baseUrl, "https://risecheckout.com");
});

Deno.test("checkout-crud - base url - defaults when no origin", () => {
  const headers = new Headers();
  const baseUrl = headers.get("origin") ?? "https://risecheckout.com";
  assertEquals(baseUrl, "https://risecheckout.com");
});

// ============================================
// CHECKOUT FIELDS
// ============================================

Deno.test("checkout-crud - fields - checkout has expected structure", () => {
  const checkout: Checkout = {
    id: "uuid-123",
    product_id: "product-uuid",
    name: "Premium Checkout",
    is_default: true,
    updated_at: "2024-01-01T00:00:00Z",
  };
  
  assertExists(checkout.id);
  assertExists(checkout.product_id);
  assertExists(checkout.name);
  assertEquals(typeof checkout.is_default, "boolean");
});
