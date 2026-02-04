/**
 * Payload Builder Tests for utmify-conversion
 * 
 * @module utmify-conversion/tests/payload.test
 * @version 2.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  UTMIFY_API_URL,
  PLATFORM_NAME,
  createDefaultConversionPayload,
  createConversionPayloadWithUtm,
} from "./_shared.ts";

describe("utmify-conversion - Payload Builder", () => {
  it("should use correct API URL", () => {
    assertEquals(UTMIFY_API_URL, "https://api.utmify.com.br/api-credentials/orders");
  });

  it("should use correct platform name", () => {
    assertEquals(PLATFORM_NAME, "RiseCheckout");
  });

  it("should create valid default conversion payload", () => {
    const payload = createDefaultConversionPayload();
    
    assertExists(payload.orderId);
    assertExists(payload.vendorId);
    assertExists(payload.paymentMethod);
    assertExists(payload.status);
    assertExists(payload.createdAt);
    assertExists(payload.customer);
    assertExists(payload.products);
    assertExists(payload.commission);
  });

  it("should include all required customer fields", () => {
    const payload = createDefaultConversionPayload();
    
    assertExists(payload.customer.name);
    assertExists(payload.customer.email);
    assertEquals(payload.customer.country, "BR");
  });

  it("should include all required product fields", () => {
    const payload = createDefaultConversionPayload();
    
    assertEquals(payload.products.length, 1);
    assertExists(payload.products[0].id);
    assertExists(payload.products[0].name);
    assertExists(payload.products[0].priceInCents);
    assertEquals(typeof payload.products[0].priceInCents, "number");
  });

  it("should include all required commission fields", () => {
    const payload = createDefaultConversionPayload();
    
    assertExists(payload.commission.totalPriceInCents);
    assertEquals(typeof payload.commission.totalPriceInCents, "number");
    assertEquals(payload.commission.currency, "BRL");
  });

  it("should include UTM parameters when provided", () => {
    const payload = createConversionPayloadWithUtm();
    
    assertExists(payload.trackingParameters);
    assertEquals(payload.trackingParameters?.utm_source, "google");
    assertEquals(payload.trackingParameters?.utm_medium, "cpc");
    assertEquals(payload.trackingParameters?.utm_campaign, "summer_sale");
    assertEquals(payload.trackingParameters?.utm_content, "banner_1");
    assertEquals(payload.trackingParameters?.utm_term, "test keyword");
  });

  it("should calculate commission correctly", () => {
    const payload = createConversionPayloadWithUtm();
    
    assertEquals(payload.commission.totalPriceInCents, 14990);
    assertEquals(payload.commission.gatewayFeeInCents, 300);
    assertEquals(payload.commission.userCommissionInCents, 14690);
  });

  it("should use correct payment method values", () => {
    const payload = createConversionPayloadWithUtm();
    
    assertEquals(payload.paymentMethod, "credit_card");
  });

  it("should use correct status values", () => {
    const payload = createDefaultConversionPayload();
    
    assertEquals(payload.status, "paid");
  });
});
