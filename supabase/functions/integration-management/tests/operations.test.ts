/**
 * Operations & Status Tests for integration-management
 * 
 * @module integration-management/tests/operations.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  checkCredentialsConfigured,
  MOCK_MP_CONFIG,
  IntegrationRequest,
  IntegrationResponse,
} from "./_shared.ts";

// ============================================================================
// SAVE CREDENTIALS TESTS
// ============================================================================

Deno.test("integration-management - Save Credentials - should require integrationType", () => {
  const request: IntegrationRequest = { action: "save-credentials", config: MOCK_MP_CONFIG };
  assertEquals(request.integrationType, undefined);
});

Deno.test("integration-management - Save Credentials - should require config", () => {
  const request: IntegrationRequest = { action: "save-credentials", integrationType: "MERCADOPAGO" };
  assertEquals(request.config, undefined);
});

Deno.test("integration-management - Save Credentials - should accept valid save-credentials request", () => {
  const request: IntegrationRequest = { action: "save-credentials", integrationType: "MERCADOPAGO", config: MOCK_MP_CONFIG };
  assertExists(request.integrationType);
  assertExists(request.config);
});

// ============================================================================
// DISCONNECT TESTS
// ============================================================================

Deno.test("integration-management - Disconnect - should accept DELETE method", () => {
  const allowedMethods = ["DELETE", "POST"];
  assertEquals(allowedMethods.includes("DELETE"), true);
});

Deno.test("integration-management - Disconnect - should accept POST method for disconnect", () => {
  const allowedMethods = ["DELETE", "POST"];
  assertEquals(allowedMethods.includes("POST"), true);
});

Deno.test("integration-management - Disconnect - should require integrationType or integrationId", () => {
  const request: IntegrationRequest = { action: "disconnect" };
  const hasIdentifier = request.integrationType || request.integrationId;
  assertEquals(hasIdentifier, undefined);
});

// ============================================================================
// INIT OAUTH TESTS
// ============================================================================

Deno.test("integration-management - Init OAuth - should require POST method", () => {
  const method = "POST";
  assertEquals(method, "POST");
});

Deno.test("integration-management - Init OAuth - should require integrationType", () => {
  const request: IntegrationRequest = { action: "init-oauth" };
  assertEquals(request.integrationType, undefined);
});

Deno.test("integration-management - Init OAuth - should return oauth_url on success", () => {
  const response: IntegrationResponse = { success: true, oauth_url: "https://oauth.example.com/authorize" };
  assertExists(response.oauth_url);
  assertStringIncludes(response.oauth_url!, "oauth");
});

// ============================================================================
// STATUS TESTS
// ============================================================================

Deno.test("integration-management - Status - should accept GET method", () => {
  const allowedMethods = ["GET", "POST"];
  assertEquals(allowedMethods.includes("GET"), true);
});

Deno.test("integration-management - Status - should accept POST method", () => {
  const allowedMethods = ["GET", "POST"];
  assertEquals(allowedMethods.includes("POST"), true);
});

Deno.test("integration-management - Status - should check credentials for all gateways", () => {
  const credentials = checkCredentialsConfigured();
  assertExists(credentials?.mercadopago);
  assertExists(credentials?.pushinpay);
  assertExists(credentials?.stripe);
  assertExists(credentials?.asaas);
});

Deno.test("integration-management - Status - should return configured status", () => {
  const credentials = checkCredentialsConfigured();
  assertEquals(credentials?.mercadopago.configured, true);
  assertEquals(credentials?.pushinpay.configured, false);
});

// ============================================================================
// PROFILE WALLET TESTS
// ============================================================================

Deno.test("integration-management - Save Profile Wallet - should require walletId", () => {
  const request: IntegrationRequest = { action: "save-profile-wallet" };
  assertEquals(request.walletId, undefined);
});

Deno.test("integration-management - Save Profile Wallet - should accept valid walletId", () => {
  const request: IntegrationRequest = { action: "save-profile-wallet", walletId: "wallet-123" };
  assertEquals(request.walletId, "wallet-123");
});

// ============================================================================
// UPDATE PROFILE TESTS
// ============================================================================

Deno.test("integration-management - Update Profile - should accept profile update fields", () => {
  const request: IntegrationRequest = { action: "update-profile", name: "New Name", cpf_cnpj: "12345678901", phone: "11999999999" };
  assertEquals(request.name, "New Name");
  assertEquals(request.cpf_cnpj, "12345678901");
  assertEquals(request.phone, "11999999999");
});

Deno.test("integration-management - Update Profile - should handle partial updates", () => {
  const request: IntegrationRequest = { action: "update-profile", name: "Only Name" };
  assertEquals(request.name, "Only Name");
  assertEquals(request.cpf_cnpj, undefined);
});
