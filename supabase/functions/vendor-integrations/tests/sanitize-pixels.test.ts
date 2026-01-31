/**
 * Vendor Integrations - Sanitize Config Tracking Pixels Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module vendor-integrations/tests/sanitize-pixels
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sanitizeConfig, MOCK_PIXEL_INTEGRATIONS } from "./_shared.ts";

Deno.test("vendor-integrations - Sanitize Config Tracking Pixels", async (t) => {
  await t.step("should expose pixel_id for TIKTOK_PIXEL", () => {
    const sanitized = sanitizeConfig(MOCK_PIXEL_INTEGRATIONS.tiktok.config, "TIKTOK_PIXEL");
    
    assertEquals(sanitized.pixel_id, "tt-pixel-123");
    assertExists(sanitized.selected_products);
  });

  await t.step("should expose pixel_id for FACEBOOK_PIXEL", () => {
    const sanitized = sanitizeConfig(MOCK_PIXEL_INTEGRATIONS.facebook.config, "FACEBOOK_PIXEL");
    
    assertEquals(sanitized.pixel_id, "fb-pixel-456");
    assertExists(sanitized.selected_products);
  });

  await t.step("should expose conversion_id and label for GOOGLE_ADS", () => {
    const sanitized = sanitizeConfig(MOCK_PIXEL_INTEGRATIONS.google.config, "GOOGLE_ADS");
    
    assertEquals(sanitized.conversion_id, "AW-123456");
    assertEquals(sanitized.conversion_label, "purchase");
    assertExists(sanitized.selected_products);
  });

  await t.step("should mask api_token for UTMIFY", () => {
    const sanitized = sanitizeConfig(MOCK_PIXEL_INTEGRATIONS.utmify.config, "UTMIFY");
    
    assertEquals(sanitized.api_token, "configured");
    assertExists(sanitized.selected_products);
  });

  await t.step("should expose pixel_id and events for KWAI_PIXEL", () => {
    const sanitized = sanitizeConfig(MOCK_PIXEL_INTEGRATIONS.kwai.config, "KWAI_PIXEL");
    
    assertEquals(sanitized.pixel_id, "kwai-pixel-789");
    assertExists(sanitized.selected_products);
    assertExists(sanitized.selected_events);
  });
});
