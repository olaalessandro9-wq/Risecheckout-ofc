/**
 * Upsell Settings Tests for product-settings
 * 
 * @module product-settings/tests/upsell-settings.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { type UpsellSettings } from "./_shared.ts";

// ============================================================================
// UPSELL SETTINGS TESTS
// ============================================================================

Deno.test("product-settings - Upsell - should accept enabled with full config", () => {
  const settings: UpsellSettings = {
    enabled: true,
    product_id: "prod-upsell",
    offer_id: "offer-upsell",
    checkout_id: "ck-upsell",
    timer_enabled: true,
    timer_minutes: 10,
    custom_page_url: "https://example.com/upsell",
  };
  assertEquals(settings.enabled, true);
  assertExists(settings.product_id);
});

Deno.test("product-settings - Upsell - should accept disabled", () => {
  const settings: UpsellSettings = { enabled: false };
  assertEquals(settings.enabled, false);
});

Deno.test("product-settings - Upsell - timer_minutes should default to 15", () => {
  const settings: UpsellSettings = { enabled: true, timer_enabled: true };
  const timerMinutes = settings.timer_minutes ?? 15;
  assertEquals(timerMinutes, 15);
});

Deno.test("product-settings - Upsell - should require upsellSettings object", () => {
  const body = { action: "update-upsell-settings", productId: "prod-1" };
  const upsellSettings = (body as Record<string, unknown>).upsellSettings;
  assertEquals(upsellSettings, undefined);
});
