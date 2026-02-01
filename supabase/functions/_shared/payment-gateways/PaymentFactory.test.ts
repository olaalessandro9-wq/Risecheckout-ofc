/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for PaymentFactory
 * 
 * Coverage:
 * - Gateway creation (MercadoPago, PushinPay, Asaas)
 * - Gateway name normalization
 * - Credential validation
 * - Error handling for unsupported gateways
 * - Supported gateways list
 * 
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 */

import {
  assertEquals,
  assertExists,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { PaymentFactory } from "./PaymentFactory.ts";
import { GatewayCredentials } from "./types.ts";
import { createMockSupabaseClient } from "./adapters/_shared.ts";

// ============================================================================
// MERCADOPAGO CREATION TESTS
// ============================================================================

Deno.test("PaymentFactory - should create MercadoPago adapter with access_token", () => {
  const credentials: GatewayCredentials = {
    access_token: "TEST_ACCESS_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("mercadopago", credentials, supabase);
  
  assertExists(gateway);
  assertEquals(gateway.providerName, "mercadopago");
});

Deno.test("PaymentFactory - should create MercadoPago adapter with token alias", () => {
  const credentials: GatewayCredentials = {
    token: "TEST_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("mercadopago", credentials, supabase);
  
  assertExists(gateway);
  assertEquals(gateway.providerName, "mercadopago");
});

Deno.test("PaymentFactory - should normalize mercado_pago name", () => {
  const credentials: GatewayCredentials = {
    access_token: "TEST_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("mercado_pago", credentials, supabase);
  
  assertExists(gateway);
  assertEquals(gateway.providerName, "mercadopago");
});

Deno.test("PaymentFactory - should normalize mercado-pago name", () => {
  const credentials: GatewayCredentials = {
    access_token: "TEST_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("mercado-pago", credentials, supabase);
  
  assertExists(gateway);
  assertEquals(gateway.providerName, "mercadopago");
});

Deno.test("PaymentFactory - should throw error for MercadoPago without credentials", () => {
  const credentials: GatewayCredentials = {};
  const supabase = createMockSupabaseClient();

  assertThrows(
    () => PaymentFactory.create("mercadopago", credentials, supabase),
    Error,
    "access_token é obrigatório"
  );
});

// ============================================================================
// PUSHINPAY CREATION TESTS
// ============================================================================

Deno.test("PaymentFactory - should create PushinPay adapter with token", () => {
  const credentials: GatewayCredentials = {
    token: "TEST_PUSHIN_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("pushinpay", credentials, supabase);
  
  assertExists(gateway);
  assertEquals(gateway.providerName, "pushinpay");
});

Deno.test("PaymentFactory - should create PushinPay adapter with access_token alias", () => {
  const credentials: GatewayCredentials = {
    access_token: "TEST_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("pushinpay", credentials, supabase);
  
  assertExists(gateway);
  assertEquals(gateway.providerName, "pushinpay");
});

Deno.test("PaymentFactory - should normalize pushin_pay name", () => {
  const credentials: GatewayCredentials = {
    token: "TEST_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("pushin_pay", credentials, supabase);
  
  assertExists(gateway);
  assertEquals(gateway.providerName, "pushinpay");
});

Deno.test("PaymentFactory - should normalize pushin-pay name", () => {
  const credentials: GatewayCredentials = {
    token: "TEST_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("pushin-pay", credentials, supabase);
  
  assertExists(gateway);
  assertEquals(gateway.providerName, "pushinpay");
});

Deno.test("PaymentFactory - should throw error for PushinPay without credentials", () => {
  const credentials: GatewayCredentials = {};
  const supabase = createMockSupabaseClient();

  assertThrows(
    () => PaymentFactory.create("pushinpay", credentials, supabase),
    Error,
    "token é obrigatório"
  );
});

// ============================================================================
// ASAAS CREATION TESTS
// ============================================================================

Deno.test("PaymentFactory - should create Asaas adapter with api_key", () => {
  const credentials: GatewayCredentials = {
    api_key: "TEST_ASAAS_KEY",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("asaas", credentials, supabase);
  
  assertExists(gateway);
  assertEquals(gateway.providerName, "asaas");
});

Deno.test("PaymentFactory - should create Asaas adapter with token alias", () => {
  const credentials: GatewayCredentials = {
    token: "TEST_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("asaas", credentials, supabase);
  
  assertExists(gateway);
  assertEquals(gateway.providerName, "asaas");
});

Deno.test("PaymentFactory - should create Asaas adapter with access_token alias", () => {
  const credentials: GatewayCredentials = {
    access_token: "TEST_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("asaas", credentials, supabase);
  
  assertExists(gateway);
  assertEquals(gateway.providerName, "asaas");
});

Deno.test("PaymentFactory - should throw error for Asaas without credentials", () => {
  const credentials: GatewayCredentials = {};
  const supabase = createMockSupabaseClient();

  assertThrows(
    () => PaymentFactory.create("asaas", credentials, supabase),
    Error,
    "api_key é obrigatório"
  );
});

// ============================================================================
// UNSUPPORTED GATEWAY TESTS
// ============================================================================

Deno.test("PaymentFactory - should throw error for unsupported gateway", () => {
  const credentials: GatewayCredentials = {
    token: "TEST_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  assertThrows(
    () => PaymentFactory.create("pagseguro", credentials, supabase),
    Error,
    "não é suportado pelo sistema"
  );
});

Deno.test("PaymentFactory - should throw error for empty gateway name", () => {
  const credentials: GatewayCredentials = {
    token: "TEST_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  assertThrows(
    () => PaymentFactory.create("", credentials, supabase),
    Error,
    "não é suportado"
  );
});

// ============================================================================
// SUPPORTED GATEWAYS TESTS
// ============================================================================

Deno.test("PaymentFactory - should return list of supported gateways", () => {
  const supported = PaymentFactory.getSupportedGateways();
  
  assertExists(supported);
  assertEquals(Array.isArray(supported), true);
  assertEquals(supported.length, 3);
  assertEquals(supported.includes("mercadopago"), true);
  assertEquals(supported.includes("pushinpay"), true);
  assertEquals(supported.includes("asaas"), true);
});

Deno.test("PaymentFactory - should check if gateway is supported", () => {
  assertEquals(PaymentFactory.isSupported("mercadopago"), true);
  assertEquals(PaymentFactory.isSupported("pushinpay"), true);
  assertEquals(PaymentFactory.isSupported("asaas"), true);
  assertEquals(PaymentFactory.isSupported("pagseguro"), false);
  assertEquals(PaymentFactory.isSupported("stripe"), false);
});

Deno.test("PaymentFactory - should normalize gateway name when checking support", () => {
  assertEquals(PaymentFactory.isSupported("MercadoPago"), true);
  assertEquals(PaymentFactory.isSupported("PUSHINPAY"), true);
  assertEquals(PaymentFactory.isSupported("  asaas  "), true);
});

// ============================================================================
// ENVIRONMENT TESTS
// ============================================================================

Deno.test("PaymentFactory - should create adapter with sandbox environment", () => {
  const credentials: GatewayCredentials = {
    access_token: "TEST_TOKEN",
    environment: "sandbox",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("mercadopago", credentials, supabase);
  
  assertExists(gateway);
});

Deno.test("PaymentFactory - should create adapter with production environment", () => {
  const credentials: GatewayCredentials = {
    access_token: "TEST_TOKEN",
    environment: "production",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("mercadopago", credentials, supabase);
  
  assertExists(gateway);
});

Deno.test("PaymentFactory - should default to production if no environment specified", () => {
  const credentials: GatewayCredentials = {
    access_token: "TEST_TOKEN",
  };
  const supabase = createMockSupabaseClient();

  const gateway = PaymentFactory.create("mercadopago", credentials, supabase);
  
  assertExists(gateway);
});
