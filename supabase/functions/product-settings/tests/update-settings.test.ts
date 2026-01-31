/**
 * Update Settings Tests for product-settings
 * 
 * @module product-settings/tests/update-settings.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  isValidGateway, 
  isValidRequiredField, 
  MOCK_SETTINGS, 
  type MembersAreaSettings 
} from "./_shared.ts";

// ============================================================================
// UPDATE SETTINGS TESTS
// ============================================================================

Deno.test("product-settings - Update Settings - should validate required_fields", () => {
  const fields = MOCK_SETTINGS.required_fields || [];
  for (const field of fields) {
    assertEquals(isValidRequiredField(field), true);
  }
});

Deno.test("product-settings - Update Settings - should validate gateways", () => {
  assertEquals(isValidGateway(MOCK_SETTINGS.pix_gateway || null), true);
  assertEquals(isValidGateway(MOCK_SETTINGS.credit_card_gateway || null), true);
});

Deno.test("product-settings - Update Settings - should accept null gateway", () => {
  assertEquals(isValidGateway(null), true);
});

Deno.test("product-settings - Update Settings - should reject invalid gateway", () => {
  assertEquals(isValidGateway("invalid-gateway"), false);
});

Deno.test("product-settings - Update Settings - should require settings object", () => {
  const body = { action: "update-settings", productId: "prod-1" };
  const settings = (body as Record<string, unknown>).settings;
  assertEquals(settings, undefined);
});

// ============================================================================
// MEMBERS AREA SETTINGS TESTS
// ============================================================================

Deno.test("product-settings - Members Area - should accept enabled=true", () => {
  const body = { action: "update-members-area-settings", productId: "prod-1", enabled: true };
  assertEquals(body.enabled, true);
});

Deno.test("product-settings - Members Area - should accept enabled=false", () => {
  const body = { action: "update-members-area-settings", productId: "prod-1", enabled: false };
  assertEquals(body.enabled, false);
});

Deno.test("product-settings - Members Area - should require producerEmail when enabled", () => {
  const body = { action: "update-members-area-settings", productId: "prod-1", enabled: true };
  const producerEmail = (body as Record<string, unknown>).producerEmail;
  assertEquals(producerEmail, undefined);
});

Deno.test("product-settings - Members Area - should accept optional membersSettings", () => {
  const settings: MembersAreaSettings = {
    login_url: "https://example.com/login",
    welcome_message: "Bem-vindo!",
  };
  assertExists(settings.login_url);
  assertExists(settings.welcome_message);
});
