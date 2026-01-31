/**
 * Vendor Integrations - Sanitize Config Payment Gateway Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module vendor-integrations/tests/sanitize-payment
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  sanitizeConfig,
  MOCK_MP_INTEGRATION,
  MOCK_STRIPE_INTEGRATION,
  MOCK_PUSHINPAY_INTEGRATION,
  MOCK_ASAAS_INTEGRATION
} from "./_shared.ts";

Deno.test("vendor-integrations - Sanitize Config Payment Gateways", async (t) => {
  await t.step("should expose only public_key and sandbox_mode for MERCADOPAGO", () => {
    const sanitized = sanitizeConfig(MOCK_MP_INTEGRATION.config, "MERCADOPAGO");
    
    assertEquals(sanitized.public_key, "TEST-public-key");
    assertEquals(sanitized.sandbox_mode, true);
    assertEquals(sanitized.access_token, undefined);
  });

  await t.step("should expose only publishable_key for STRIPE", () => {
    const sanitized = sanitizeConfig(MOCK_STRIPE_INTEGRATION.config, "STRIPE");
    
    assertEquals(sanitized.publishable_key, "pk_test_123");
    assertEquals(sanitized.secret_key, undefined);
  });

  await t.step("should expose only has_token for PUSHINPAY", () => {
    const sanitized = sanitizeConfig(MOCK_PUSHINPAY_INTEGRATION.config, "PUSHINPAY");
    
    assertEquals(sanitized.has_token, true);
    assertEquals(sanitized.pushinpay_token, undefined);
  });

  await t.step("should expose sandbox_mode and has_api_key for ASAAS", () => {
    const sanitized = sanitizeConfig(MOCK_ASAAS_INTEGRATION.config, "ASAAS");
    
    assertEquals(sanitized.sandbox_mode, true);
    assertEquals(sanitized.environment, "sandbox");
    assertEquals(sanitized.has_api_key, true);
    assertEquals(sanitized.api_key, undefined);
  });
});
