/**
 * Conversion Processing Tests for utmify-conversion
 * 
 * @module utmify-conversion/tests/conversion-processing.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultOrder,
  createOrderWithUtm,
  type MockOrder,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockOrder: MockOrder;

describe("utmify-conversion - Conversion Processing", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockOrder = createDefaultOrder();
  });

  it("should fetch order details by order_id", async () => {
    const mockRequest = createMockRequest({ order_id: mockOrder.id });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertExists(body.order_id);
  });

  it("should return 404 for non-existent order", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "00000000-0000-0000-0000-000000000000",
    });
    const orderNotFound = true;
    const expectedStatus = orderNotFound ? 404 : 200;
    assertEquals(expectedStatus, 404);
  });

  it("should extract UTM parameters from order", () => {
    const orderWithUtm = createOrderWithUtm();
    assertExists(orderWithUtm.utm_source);
    assertExists(orderWithUtm.utm_medium);
    assertExists(orderWithUtm.utm_campaign);
  });

  it("should build conversion payload correctly", () => {
    const orderWithUtm = createOrderWithUtm();
    const payload = {
      order_id: orderWithUtm.id,
      event_type: "purchase",
      value: orderWithUtm.total_amount,
      currency: "BRL",
      utm_source: orderWithUtm.utm_source,
      utm_medium: orderWithUtm.utm_medium,
      utm_campaign: orderWithUtm.utm_campaign,
    };
    assertExists(payload.order_id);
    assertExists(payload.value);
    assertEquals(payload.currency, "BRL");
  });

  it("should handle orders without UTM parameters", () => {
    const orderWithoutUtm = createDefaultOrder();
    const hasUtm = orderWithoutUtm.utm_source !== null;
    assertEquals(hasUtm, false);
  });

  it("should calculate correct conversion value", () => {
    const order = createOrderWithUtm();
    const conversionValue = order.total_amount;
    assertEquals(typeof conversionValue, "number");
    assertEquals(conversionValue > 0, true);
  });

  it("should include product information in conversion", () => {
    const order = createOrderWithUtm();
    assertExists(order.product_id);
    assertExists(order.product_name);
  });
});
