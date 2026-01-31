/**
 * Config Validation Tests for integration-management
 * 
 * @module integration-management/tests/config-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validateConfig,
  MOCK_MP_CONFIG,
  MOCK_STRIPE_CONFIG,
  MOCK_ASAAS_CONFIG,
  MOCK_PUSHINPAY_CONFIG,
} from "./_shared.ts";

// ============================================================================
// CONFIG VALIDATION TESTS
// ============================================================================

Deno.test("integration-management - Config Validation - should validate MERCADOPAGO config", () => {
  const error = validateConfig("MERCADOPAGO", MOCK_MP_CONFIG);
  assertEquals(error, null);
});

Deno.test("integration-management - Config Validation - should require public_key for MERCADOPAGO", () => {
  const error = validateConfig("MERCADOPAGO", { access_token: "token" });
  assertExists(error);
  assertStringIncludes(error, "public_key");
});

Deno.test("integration-management - Config Validation - should validate STRIPE config", () => {
  const error = validateConfig("STRIPE", MOCK_STRIPE_CONFIG);
  assertEquals(error, null);
});

Deno.test("integration-management - Config Validation - should require publishable_key for STRIPE", () => {
  const error = validateConfig("STRIPE", { secret_key: "sk" });
  assertExists(error);
  assertStringIncludes(error, "publishable_key");
});

Deno.test("integration-management - Config Validation - should validate ASAAS config", () => {
  const error = validateConfig("ASAAS", MOCK_ASAAS_CONFIG);
  assertEquals(error, null);
});

Deno.test("integration-management - Config Validation - should require api_key for ASAAS", () => {
  const error = validateConfig("ASAAS", { sandbox_mode: true });
  assertExists(error);
  assertStringIncludes(error, "api_key");
});

Deno.test("integration-management - Config Validation - should validate PUSHINPAY config", () => {
  const error = validateConfig("PUSHINPAY", MOCK_PUSHINPAY_CONFIG);
  assertEquals(error, null);
});

Deno.test("integration-management - Config Validation - should require pushinpay_token for PUSHINPAY", () => {
  const error = validateConfig("PUSHINPAY", { account_id: "123" });
  assertExists(error);
  assertStringIncludes(error, "pushinpay_token");
});
