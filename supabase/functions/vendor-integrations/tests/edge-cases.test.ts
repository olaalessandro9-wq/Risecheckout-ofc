/**
 * Vendor Integrations - Edge Cases Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module vendor-integrations/tests/edge-cases
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sanitizeConfig, type IntegrationConfig } from "./_shared.ts";

Deno.test("vendor-integrations - Sanitize Config Edge Cases", async (t) => {
  await t.step("should return empty object for null config", () => {
    const sanitized = sanitizeConfig(null, "MERCADOPAGO");
    assertEquals(Object.keys(sanitized).length, 0);
  });

  await t.step("should return empty object for unknown type", () => {
    const config: IntegrationConfig = { public_key: "test" };
    const sanitized = sanitizeConfig(config, "UNKNOWN_TYPE");
    assertEquals(Object.keys(sanitized).length, 0);
  });

  await t.step("should handle missing optional fields", () => {
    const partialConfig: IntegrationConfig = { public_key: "key-123" };
    const sanitized = sanitizeConfig(partialConfig, "MERCADOPAGO");
    
    assertEquals(sanitized.public_key, "key-123");
    assertEquals(sanitized.sandbox_mode, undefined);
  });
});
