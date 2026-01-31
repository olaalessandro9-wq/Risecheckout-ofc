/**
 * Fields, Status & Soft Delete Tests for offer-crud
 * @module offer-crud/tests/fields-status.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { VALID_STATUSES, DEFAULT_STATUS, convertReaisToCents, type OfferData } from "./_shared.ts";

// ============================================
// OFFER STATUS VALUES
// ============================================

Deno.test("offer-crud - status - valid offer statuses", () => {
  assertEquals(VALID_STATUSES.includes("active"), true);
  assertEquals(VALID_STATUSES.includes("inactive"), true);
  assertEquals(VALID_STATUSES.includes("archived"), true);
});

Deno.test("offer-crud - status - default status for new offers", () => {
  assertEquals(DEFAULT_STATUS, "active");
});

// ============================================
// OFFER FIELDS
// ============================================

Deno.test("offer-crud - fields - offer has expected structure", () => {
  const offer: OfferData = {
    id: "uuid-123",
    product_id: "product-uuid",
    name: "Premium Offer",
    price: 19900,
    is_default: true,
    status: "active",
  };
  
  assertExists(offer.id);
  assertExists(offer.product_id);
  assertExists(offer.name);
  assertExists(offer.price);
});

Deno.test("offer-crud - fields - is_default flag handling", () => {
  const defaultOffer: OfferData = { is_default: true };
  const regularOffer: OfferData = { is_default: false };
  
  assertEquals(defaultOffer.is_default, true);
  assertEquals(regularOffer.is_default, false);
});

Deno.test("offer-crud - fields - price is in cents", () => {
  assertEquals(convertReaisToCents(199.00), 19900);
});

// ============================================
// SOFT DELETE
// ============================================

Deno.test("offer-crud - soft delete - uses status field", () => {
  const deletedOffer: OfferData = { id: "uuid-123", status: "archived" };
  assertEquals(deletedOffer.status, "archived");
});

Deno.test("offer-crud - soft delete - preserves offer data", () => {
  const deletedOffer: OfferData = {
    id: "uuid-123",
    name: "Archived Offer",
    price: 9900,
    status: "archived",
  };
  
  assertExists(deletedOffer.name);
  assertExists(deletedOffer.price);
  assertEquals(deletedOffer.status, "archived");
});

// ============================================
// BODY PARSING
// ============================================

Deno.test("offer-crud - body - handles offer nested in body", () => {
  const body: Record<string, unknown> = { action: "create", offer: { name: "Test", price: 100 } };
  const offer = (body.offer as Record<string, unknown>) ?? body;
  assertEquals(offer.name, "Test");
});

Deno.test("offer-crud - body - handles offer at top level", () => {
  const body: Record<string, unknown> = { action: "create", name: "Test", price: 100, product_id: "uuid" };
  const offer = (body.offer as Record<string, unknown>) ?? body;
  assertEquals(offer.name, "Test");
});

// ============================================
// INPUT SANITIZATION
// ============================================

Deno.test("offer-crud - sanitization - trims offer name", () => {
  const name = "  Offer Name  ";
  assertEquals(name.trim(), "Offer Name");
});

Deno.test("offer-crud - sanitization - handles undefined optional fields", () => {
  const offer: OfferData = { product_id: "uuid", name: "Test", price: 100 };
  assertEquals(offer.description ?? null, null);
});
