/**
 * Response Building Tests for product-full-loader
 * 
 * @module product-full-loader/tests/response-building.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildFullResponse,
  MOCK_PRODUCT,
  MOCK_UPSELL_SETTINGS,
  MOCK_AFFILIATE_SETTINGS,
} from "./_shared.ts";

// ============================================================================
// RESPONSE BUILDING TESTS
// ============================================================================

Deno.test("product-full-loader - Response Building - should build complete response with all data", () => {
  const response = buildFullResponse(
    MOCK_PRODUCT,
    MOCK_UPSELL_SETTINGS,
    MOCK_AFFILIATE_SETTINGS
  );

  assertEquals(response.success, true);
  assertExists(response.data);
  assertExists(response.data.product);
  assertExists(response.data.upsellSettings);
  assertExists(response.data.affiliateSettings);
});

Deno.test("product-full-loader - Response Building - should include empty arrays for collections", () => {
  const response = buildFullResponse(MOCK_PRODUCT, null, null);

  assertExists(response.data);
  assertEquals(Array.isArray(response.data.offers), true);
  assertEquals(Array.isArray(response.data.orderBumps), true);
  assertEquals(Array.isArray(response.data.checkouts), true);
  assertEquals(Array.isArray(response.data.paymentLinks), true);
  assertEquals(Array.isArray(response.data.coupons), true);
});

Deno.test("product-full-loader - Response Building - should handle null product gracefully", () => {
  const response = buildFullResponse(null, null, null);

  assertEquals(response.success, true);
  assertExists(response.data);
  assertEquals(response.data.product, null);
});

Deno.test("product-full-loader - Response Building - should preserve product data correctly", () => {
  const response = buildFullResponse(MOCK_PRODUCT, null, null);

  assertExists(response.data?.product);
  assertEquals(response.data.product.id, MOCK_PRODUCT.id);
  assertEquals(response.data.product.name, MOCK_PRODUCT.name);
  assertEquals(response.data.product.price, MOCK_PRODUCT.price);
});

Deno.test("product-full-loader - Response Building - should preserve upsell settings", () => {
  const response = buildFullResponse(MOCK_PRODUCT, MOCK_UPSELL_SETTINGS, null);

  assertExists(response.data?.upsellSettings);
  assertEquals(response.data.upsellSettings.enabled, true);
  assertEquals(response.data.upsellSettings.discount_percentage, 20);
});

Deno.test("product-full-loader - Response Building - should preserve affiliate settings", () => {
  const response = buildFullResponse(MOCK_PRODUCT, null, MOCK_AFFILIATE_SETTINGS);

  assertExists(response.data?.affiliateSettings);
  assertEquals(response.data.affiliateSettings.is_affiliate_enabled, true);
  assertEquals(response.data.affiliateSettings.commission_rate, 30);
  assertEquals(response.data.affiliateSettings.cookie_days, 30);
});
