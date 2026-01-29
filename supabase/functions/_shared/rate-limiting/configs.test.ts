/**
 * Rate Limiting Configs Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for rate limiting configuration values and structure.
 * CRITICAL: Proper rate limit configs prevent service abuse.
 * 
 * @module _shared/rate-limiting/configs.test
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  BUYER_AUTH_LOGIN,
  BUYER_AUTH_REGISTER,
  BUYER_AUTH_RESET,
  PRODUCER_AUTH_LOGIN,
  PRODUCER_AUTH_RESET,
  CREATE_ORDER,
  CREATE_PIX,
  ASAAS_CREATE_PAYMENT,
  MERCADOPAGO_CREATE_PAYMENT,
  STRIPE_CREATE_PAYMENT,
  WEBHOOK,
  WEBHOOK_TEST,
  MEMBERS_AREA,
  MEMBERS_AREA_WRITE,
  TURNSTILE_VERIFY,
  DECRYPT_DATA,
  VAULT_SAVE,
  ADMIN_ACTION,
  SEND_EMAIL,
  PRODUCER_ACTION,
  AFFILIATION_MANAGE,
  PRODUCT_SETTINGS,
  PIXEL_MANAGEMENT,
  CRUD_DEFAULT,
  GDPR_REQUEST,
  GDPR_FORGET,
  DEFAULT,
  RATE_LIMIT_CONFIGS,
} from "./configs.ts";
import type { RateLimitConfig } from "./types.ts";

// ============================================================================
// Config Structure Tests
// ============================================================================

function assertValidConfig(config: RateLimitConfig, name: string): void {
  assertExists(config.action, `${name}: action must exist`);
  assertEquals(typeof config.action, "string", `${name}: action must be string`);
  assertEquals(typeof config.maxAttempts, "number", `${name}: maxAttempts must be number`);
  assertEquals(typeof config.windowMinutes, "number", `${name}: windowMinutes must be number`);
  assertEquals(typeof config.blockDurationMinutes, "number", `${name}: blockDurationMinutes must be number`);
  
  // Sanity checks
  assertEquals(config.maxAttempts > 0, true, `${name}: maxAttempts must be positive`);
  assertEquals(config.windowMinutes > 0, true, `${name}: windowMinutes must be positive`);
  assertEquals(config.blockDurationMinutes > 0, true, `${name}: blockDurationMinutes must be positive`);
}

// ============================================================================
// Authentication Configs Tests
// ============================================================================

Deno.test("BUYER_AUTH_LOGIN: should have correct structure", () => {
  assertValidConfig(BUYER_AUTH_LOGIN, "BUYER_AUTH_LOGIN");
  assertEquals(BUYER_AUTH_LOGIN.action, "buyer_auth_login");
});

Deno.test("BUYER_AUTH_LOGIN: should allow 10 attempts in 15 minutes", () => {
  assertEquals(BUYER_AUTH_LOGIN.maxAttempts, 10);
  assertEquals(BUYER_AUTH_LOGIN.windowMinutes, 15);
  assertEquals(BUYER_AUTH_LOGIN.blockDurationMinutes, 30);
});

Deno.test("BUYER_AUTH_REGISTER: should have correct structure", () => {
  assertValidConfig(BUYER_AUTH_REGISTER, "BUYER_AUTH_REGISTER");
  assertEquals(BUYER_AUTH_REGISTER.action, "buyer_auth_register");
});

Deno.test("BUYER_AUTH_REGISTER: should be more restrictive than login", () => {
  assertEquals(BUYER_AUTH_REGISTER.maxAttempts < BUYER_AUTH_LOGIN.maxAttempts, true);
});

Deno.test("BUYER_AUTH_RESET: should have correct structure", () => {
  assertValidConfig(BUYER_AUTH_RESET, "BUYER_AUTH_RESET");
  assertEquals(BUYER_AUTH_RESET.action, "buyer_auth_reset");
});

Deno.test("PRODUCER_AUTH_LOGIN: should have correct structure", () => {
  assertValidConfig(PRODUCER_AUTH_LOGIN, "PRODUCER_AUTH_LOGIN");
  assertEquals(PRODUCER_AUTH_LOGIN.action, "producer_auth_login");
});

Deno.test("PRODUCER_AUTH_LOGIN: should allow more attempts than buyer login", () => {
  assertEquals(PRODUCER_AUTH_LOGIN.maxAttempts >= BUYER_AUTH_LOGIN.maxAttempts, true);
});

Deno.test("PRODUCER_AUTH_RESET: should have correct structure", () => {
  assertValidConfig(PRODUCER_AUTH_RESET, "PRODUCER_AUTH_RESET");
  assertEquals(PRODUCER_AUTH_RESET.action, "producer_password_reset");
});

// ============================================================================
// Payment Configs Tests (HIGH VOLUME)
// ============================================================================

Deno.test("CREATE_ORDER: should have correct structure", () => {
  assertValidConfig(CREATE_ORDER, "CREATE_ORDER");
  assertEquals(CREATE_ORDER.action, "create_order");
});

Deno.test("CREATE_ORDER: should allow high volume (60/min)", () => {
  assertEquals(CREATE_ORDER.maxAttempts, 60);
  assertEquals(CREATE_ORDER.windowMinutes, 1);
  assertEquals(CREATE_ORDER.blockDurationMinutes, 2); // Short block for payments
});

Deno.test("CREATE_PIX: should have same limits as CREATE_ORDER", () => {
  assertEquals(CREATE_PIX.maxAttempts, CREATE_ORDER.maxAttempts);
  assertEquals(CREATE_PIX.windowMinutes, CREATE_ORDER.windowMinutes);
  assertEquals(CREATE_PIX.blockDurationMinutes, CREATE_ORDER.blockDurationMinutes);
});

Deno.test("ASAAS_CREATE_PAYMENT: should have same limits as CREATE_ORDER", () => {
  assertEquals(ASAAS_CREATE_PAYMENT.maxAttempts, CREATE_ORDER.maxAttempts);
  assertEquals(ASAAS_CREATE_PAYMENT.windowMinutes, CREATE_ORDER.windowMinutes);
});

Deno.test("MERCADOPAGO_CREATE_PAYMENT: should have same limits as CREATE_ORDER", () => {
  assertEquals(MERCADOPAGO_CREATE_PAYMENT.maxAttempts, CREATE_ORDER.maxAttempts);
  assertEquals(MERCADOPAGO_CREATE_PAYMENT.windowMinutes, CREATE_ORDER.windowMinutes);
});

Deno.test("STRIPE_CREATE_PAYMENT: should have same limits as CREATE_ORDER", () => {
  assertEquals(STRIPE_CREATE_PAYMENT.maxAttempts, CREATE_ORDER.maxAttempts);
  assertEquals(STRIPE_CREATE_PAYMENT.windowMinutes, CREATE_ORDER.windowMinutes);
});

// ============================================================================
// Webhook Configs Tests (VERY HIGH VOLUME)
// ============================================================================

Deno.test("WEBHOOK: should have correct structure", () => {
  assertValidConfig(WEBHOOK, "WEBHOOK");
  assertEquals(WEBHOOK.action, "webhook");
});

Deno.test("WEBHOOK: should allow very high volume (300/min)", () => {
  assertEquals(WEBHOOK.maxAttempts, 300);
  assertEquals(WEBHOOK.windowMinutes, 1);
});

Deno.test("WEBHOOK: should have higher limit than payment configs", () => {
  assertEquals(WEBHOOK.maxAttempts > CREATE_ORDER.maxAttempts, true);
});

Deno.test("WEBHOOK_TEST: should have correct structure", () => {
  assertValidConfig(WEBHOOK_TEST, "WEBHOOK_TEST");
  assertEquals(WEBHOOK_TEST.action, "webhook_test");
});

Deno.test("WEBHOOK_TEST: should have lower limit than production webhook", () => {
  assertEquals(WEBHOOK_TEST.maxAttempts < WEBHOOK.maxAttempts, true);
});

// ============================================================================
// Members Area Configs Tests
// ============================================================================

Deno.test("MEMBERS_AREA: should have correct structure", () => {
  assertValidConfig(MEMBERS_AREA, "MEMBERS_AREA");
  assertEquals(MEMBERS_AREA.action, "members_area");
});

Deno.test("MEMBERS_AREA: should allow high read volume (120/min)", () => {
  assertEquals(MEMBERS_AREA.maxAttempts, 120);
});

Deno.test("MEMBERS_AREA_WRITE: should have lower limit than read", () => {
  assertEquals(MEMBERS_AREA_WRITE.maxAttempts < MEMBERS_AREA.maxAttempts, true);
});

// ============================================================================
// Security Configs Tests
// ============================================================================

Deno.test("TURNSTILE_VERIFY: should have correct structure", () => {
  assertValidConfig(TURNSTILE_VERIFY, "TURNSTILE_VERIFY");
  assertEquals(TURNSTILE_VERIFY.action, "turnstile_verify");
});

Deno.test("DECRYPT_DATA: should have correct structure", () => {
  assertValidConfig(DECRYPT_DATA, "DECRYPT_DATA");
  assertEquals(DECRYPT_DATA.action, "decrypt_data");
});

Deno.test("VAULT_SAVE: should have correct structure", () => {
  assertValidConfig(VAULT_SAVE, "VAULT_SAVE");
  assertEquals(VAULT_SAVE.action, "vault_save");
});

// ============================================================================
// GDPR Configs Tests (STRICT)
// ============================================================================

Deno.test("GDPR_REQUEST: should have correct structure", () => {
  assertValidConfig(GDPR_REQUEST, "GDPR_REQUEST");
  assertEquals(GDPR_REQUEST.action, "gdpr_request");
});

Deno.test("GDPR_REQUEST: should be very restrictive", () => {
  assertEquals(GDPR_REQUEST.maxAttempts, 5);
  assertEquals(GDPR_REQUEST.windowMinutes, 60);
  assertEquals(GDPR_REQUEST.blockDurationMinutes, 60);
});

Deno.test("GDPR_FORGET: should have correct structure", () => {
  assertValidConfig(GDPR_FORGET, "GDPR_FORGET");
  assertEquals(GDPR_FORGET.action, "gdpr_forget");
});

Deno.test("GDPR_FORGET: should be more restrictive than GDPR_REQUEST", () => {
  assertEquals(GDPR_FORGET.blockDurationMinutes >= GDPR_REQUEST.blockDurationMinutes, true);
});

// ============================================================================
// Admin Configs Tests
// ============================================================================

Deno.test("ADMIN_ACTION: should have correct structure", () => {
  assertValidConfig(ADMIN_ACTION, "ADMIN_ACTION");
  assertEquals(ADMIN_ACTION.action, "admin_action");
});

Deno.test("SEND_EMAIL: should have correct structure", () => {
  assertValidConfig(SEND_EMAIL, "SEND_EMAIL");
  assertEquals(SEND_EMAIL.action, "send_email");
});

Deno.test("SEND_EMAIL: should have moderate limit (20/min)", () => {
  assertEquals(SEND_EMAIL.maxAttempts, 20);
});

// ============================================================================
// Producer Configs Tests
// ============================================================================

Deno.test("PRODUCER_ACTION: should have correct structure", () => {
  assertValidConfig(PRODUCER_ACTION, "PRODUCER_ACTION");
  assertEquals(PRODUCER_ACTION.action, "producer_action");
});

Deno.test("AFFILIATION_MANAGE: should have correct structure", () => {
  assertValidConfig(AFFILIATION_MANAGE, "AFFILIATION_MANAGE");
  assertEquals(AFFILIATION_MANAGE.action, "affiliation_manage");
});

Deno.test("PRODUCT_SETTINGS: should have correct structure", () => {
  assertValidConfig(PRODUCT_SETTINGS, "PRODUCT_SETTINGS");
  assertEquals(PRODUCT_SETTINGS.action, "product_settings");
});

Deno.test("PIXEL_MANAGEMENT: should have correct structure", () => {
  assertValidConfig(PIXEL_MANAGEMENT, "PIXEL_MANAGEMENT");
  assertEquals(PIXEL_MANAGEMENT.action, "pixel_management");
});

// ============================================================================
// Default Config Tests
// ============================================================================

Deno.test("CRUD_DEFAULT: should have correct structure", () => {
  assertValidConfig(CRUD_DEFAULT, "CRUD_DEFAULT");
  assertEquals(CRUD_DEFAULT.action, "crud_default");
});

Deno.test("DEFAULT: should have correct structure", () => {
  assertValidConfig(DEFAULT, "DEFAULT");
  assertEquals(DEFAULT.action, "default");
});

Deno.test("DEFAULT: should have reasonable defaults (60/min)", () => {
  assertEquals(DEFAULT.maxAttempts, 60);
  assertEquals(DEFAULT.windowMinutes, 1);
});

// ============================================================================
// RATE_LIMIT_CONFIGS Map Tests
// ============================================================================

Deno.test("RATE_LIMIT_CONFIGS: should export all authentication configs", () => {
  assertExists(RATE_LIMIT_CONFIGS.BUYER_AUTH_LOGIN);
  assertExists(RATE_LIMIT_CONFIGS.BUYER_AUTH_REGISTER);
  assertExists(RATE_LIMIT_CONFIGS.BUYER_AUTH_RESET);
  assertExists(RATE_LIMIT_CONFIGS.PRODUCER_AUTH_LOGIN);
  assertExists(RATE_LIMIT_CONFIGS.PRODUCER_AUTH_RESET);
});

Deno.test("RATE_LIMIT_CONFIGS: should export all payment configs", () => {
  assertExists(RATE_LIMIT_CONFIGS.CREATE_ORDER);
  assertExists(RATE_LIMIT_CONFIGS.CREATE_PIX);
  assertExists(RATE_LIMIT_CONFIGS.ASAAS_CREATE_PAYMENT);
  assertExists(RATE_LIMIT_CONFIGS.MERCADOPAGO_CREATE_PAYMENT);
  assertExists(RATE_LIMIT_CONFIGS.STRIPE_CREATE_PAYMENT);
});

Deno.test("RATE_LIMIT_CONFIGS: should export all webhook configs", () => {
  assertExists(RATE_LIMIT_CONFIGS.WEBHOOK);
  assertExists(RATE_LIMIT_CONFIGS.WEBHOOK_TEST);
});

Deno.test("RATE_LIMIT_CONFIGS: should export all GDPR configs", () => {
  assertExists(RATE_LIMIT_CONFIGS.GDPR_REQUEST);
  assertExists(RATE_LIMIT_CONFIGS.GDPR_FORGET);
});

Deno.test("RATE_LIMIT_CONFIGS: should export default config", () => {
  assertExists(RATE_LIMIT_CONFIGS.DEFAULT);
});

Deno.test("RATE_LIMIT_CONFIGS: configs should be readonly", () => {
  // TypeScript enforces this at compile time
  // Runtime check that values exist and are objects
  assertEquals(typeof RATE_LIMIT_CONFIGS.CREATE_ORDER, "object");
  assertEquals(RATE_LIMIT_CONFIGS.CREATE_ORDER.maxAttempts, 60);
});

// ============================================================================
// Business Logic Tests
// ============================================================================

Deno.test("Business: Payment configs should have short block duration", () => {
  // Payment configs should not block for too long (lost sales risk)
  assertEquals(CREATE_ORDER.blockDurationMinutes <= 5, true);
  assertEquals(CREATE_PIX.blockDurationMinutes <= 5, true);
});

Deno.test("Business: Auth configs should have longer block duration", () => {
  // Auth brute force should be blocked for longer
  assertEquals(BUYER_AUTH_LOGIN.blockDurationMinutes >= 15, true);
});

Deno.test("Business: GDPR configs should be the most restrictive", () => {
  // GDPR operations are sensitive and should be heavily rate limited
  const allConfigs = Object.values(RATE_LIMIT_CONFIGS);
  const nonGdprConfigs = allConfigs.filter(
    c => !c.action.includes("gdpr")
  );
  
  // GDPR should have one of the lowest maxAttempts
  const minNonGdpr = Math.min(...nonGdprConfigs.map(c => c.maxAttempts));
  assertEquals(GDPR_REQUEST.maxAttempts <= minNonGdpr, true);
});

Deno.test("Business: Webhook should have highest limit", () => {
  // Webhooks from gateways need high throughput
  const allConfigs = Object.values(RATE_LIMIT_CONFIGS);
  const maxLimit = Math.max(...allConfigs.map(c => c.maxAttempts));
  
  assertEquals(WEBHOOK.maxAttempts, maxLimit);
});
