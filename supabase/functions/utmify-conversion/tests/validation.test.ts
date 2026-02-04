/**
 * Validation Tests for utmify-conversion
 * 
 * @module utmify-conversion/tests/validation.test
 * @version 2.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createDefaultConversionPayload,
  createConversionPayloadWithUtm,
} from "./_shared.ts";

describe("utmify-conversion - Validation", () => {
  it("should require orderId", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.orderId);
    assertEquals(typeof payload.orderId, "string");
  });

  it("should require vendorId", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.vendorId);
    assertEquals(typeof payload.vendorId, "string");
  });

  it("should require paymentMethod", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.paymentMethod);
    assertEquals(typeof payload.paymentMethod, "string");
  });

  it("should require status", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.status);
    assertEquals(typeof payload.status, "string");
  });

  it("should require createdAt", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.createdAt);
    assertEquals(typeof payload.createdAt, "string");
  });

  it("should require customer object", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.customer);
    assertEquals(typeof payload.customer, "object");
  });

  it("should require customer.name", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.customer.name);
    assertEquals(typeof payload.customer.name, "string");
  });

  it("should require customer.email", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.customer.email);
    assertEquals(typeof payload.customer.email, "string");
  });

  it("should require products array", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.products);
    assertEquals(Array.isArray(payload.products), true);
    assertEquals(payload.products.length > 0, true);
  });

  it("should require product.id", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.products[0].id);
    assertEquals(typeof payload.products[0].id, "string");
  });

  it("should require product.name", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.products[0].name);
    assertEquals(typeof payload.products[0].name, "string");
  });

  it("should require product.priceInCents", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.products[0].priceInCents);
    assertEquals(typeof payload.products[0].priceInCents, "number");
    assertEquals(payload.products[0].priceInCents > 0, true);
  });

  it("should require commission object", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.commission);
    assertEquals(typeof payload.commission, "object");
  });

  it("should require commission.totalPriceInCents", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.commission.totalPriceInCents);
    assertEquals(typeof payload.commission.totalPriceInCents, "number");
  });

  it("should validate UUID format for orderId", () => {
    const payload = createDefaultConversionPayload();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    assertEquals(uuidRegex.test(payload.orderId), true);
  });

  it("should accept null for optional fields", () => {
    const payload = createDefaultConversionPayload();
    assertEquals(payload.approvedDate === null || typeof payload.approvedDate === "string", true);
    assertEquals(payload.refundedAt === null || typeof payload.refundedAt === "string", true);
  });

  it("should accept optional tracking parameters", () => {
    const payloadWithUtm = createConversionPayloadWithUtm();
    assertExists(payloadWithUtm.trackingParameters);
    
    const payloadWithoutUtm = createDefaultConversionPayload();
    assertExists(payloadWithoutUtm.trackingParameters);
  });
});
