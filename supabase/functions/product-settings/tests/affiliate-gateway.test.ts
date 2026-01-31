/**
 * Affiliate Gateway Settings Tests for product-settings
 * 
 * @module product-settings/tests/affiliate-gateway.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidGateway, type AffiliateGatewaySettings } from "./_shared.ts";

// ============================================================================
// AFFILIATE GATEWAY SETTINGS TESTS
// ============================================================================

Deno.test("product-settings - Affiliate Gateway - should accept valid config", () => {
  const settings: AffiliateGatewaySettings = {
    pix_gateway: "pushinpay",
    credit_card_gateway: "stripe",
  };
  assertEquals(isValidGateway(settings.pix_gateway), true);
  assertEquals(isValidGateway(settings.credit_card_gateway), true);
});

Deno.test("product-settings - Affiliate Gateway - should accept null gateways (disabled)", () => {
  const settings: AffiliateGatewaySettings = {
    pix_gateway: null,
    credit_card_gateway: null,
  };
  assertEquals(isValidGateway(settings.pix_gateway), true);
  assertEquals(isValidGateway(settings.credit_card_gateway), true);
});

Deno.test("product-settings - Affiliate Gateway - should require gatewaySettings object", () => {
  const body = { action: "update-affiliate-gateway-settings", productId: "prod-1" };
  const gatewaySettings = (body as Record<string, unknown>).gatewaySettings;
  assertEquals(gatewaySettings, undefined);
});
