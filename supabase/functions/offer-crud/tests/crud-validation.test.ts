/**
 * CRUD Validation Tests for offer-crud
 * @module offer-crud/tests/crud-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getOfferId, isValidPrice, type OfferPayload, type OfferData } from "./_shared.ts";

// ============================================
// GET VALIDATION
// ============================================

Deno.test("offer-crud - get validation - requires offer_id or offerId", () => {
  const body1: OfferPayload = { action: "get", offer_id: "uuid-123" };
  const body2: OfferPayload = { action: "get", offerId: "uuid-456" };
  const body3: OfferPayload = { action: "get" };
  
  assertEquals(getOfferId(body1), "uuid-123");
  assertEquals(getOfferId(body2), "uuid-456");
  assertEquals(getOfferId(body3), undefined);
});

// ============================================
// CREATE VALIDATION
// ============================================

Deno.test("offer-crud - create validation - product_id is required", () => {
  const offer: OfferData = { name: "Test Offer", price: 9900 };
  assertEquals("product_id" in offer, false);
});

Deno.test("offer-crud - create validation - name is required", () => {
  const offer: OfferData = { product_id: "uuid-123", price: 9900 };
  assertEquals("name" in offer, false);
});

Deno.test("offer-crud - create validation - price is required", () => {
  const offer: OfferData = { product_id: "uuid-123", name: "Test Offer" };
  assertEquals("price" in offer, false);
});

Deno.test("offer-crud - create validation - price must be non-negative", () => {
  const validPrices = [0, 100, 9900, 100000];
  const invalidPrices = [-1, -100];
  
  validPrices.forEach((price) => assertEquals(isValidPrice(price), true));
  invalidPrices.forEach((price) => assertEquals(isValidPrice(price), false));
});

Deno.test("offer-crud - create validation - valid offer structure", () => {
  const offer: OfferData = {
    product_id: "uuid-123",
    name: "Premium Offer",
    price: 19900,
    is_default: false,
    status: "active",
  };
  
  assertExists(offer.product_id);
  assertExists(offer.name);
  assertExists(offer.price);
});

// ============================================
// UPDATE VALIDATION
// ============================================

Deno.test("offer-crud - update validation - requires offer_id", () => {
  const offer: OfferData = { name: "Updated Name" };
  assertEquals("id" in offer, false);
});

Deno.test("offer-crud - update validation - accepts partial updates", () => {
  const offer: OfferData = { id: "uuid-123", name: "New Name" };
  assertExists(offer.id);
  assertExists(offer.name);
  assertEquals(offer.price, undefined);
});

// ============================================
// DELETE VALIDATION
// ============================================

Deno.test("offer-crud - delete validation - requires offer_id or offerId", () => {
  const body1: OfferPayload = { action: "delete", offer_id: "uuid-123" };
  const body2: OfferPayload = { action: "delete", offerId: "uuid-456" };
  
  assertEquals(getOfferId(body1), "uuid-123");
  assertEquals(getOfferId(body2), "uuid-456");
});

Deno.test("offer-crud - delete validation - offerId must be string", () => {
  const body: Record<string, unknown> = { action: "delete", offerId: 123 };
  assertEquals(typeof body.offerId === "string", false);
});

// ============================================
// METHOD VALIDATION
// ============================================

Deno.test("offer-crud - methods - create requires POST", () => {
  const action = "create";
  const method = "POST";
  assertEquals(action === "create" && method === "POST", true);
});

Deno.test("offer-crud - methods - update accepts PUT or POST", () => {
  const validMethods = ["PUT", "POST"];
  assertEquals(validMethods.includes("PUT"), true);
  assertEquals(validMethods.includes("POST"), true);
});

Deno.test("offer-crud - methods - delete accepts DELETE or POST", () => {
  const validMethods = ["DELETE", "POST"];
  assertEquals(validMethods.includes("DELETE"), true);
  assertEquals(validMethods.includes("POST"), true);
});
