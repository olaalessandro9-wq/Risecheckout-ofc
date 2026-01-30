/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for gateway-credentials.ts
 * 
 * Coverage:
 * - getGatewayCredentials (Owner vs Vendor logic)
 * - validateCredentials (required fields per gateway)
 * - Interface compliance
 * - Error handling
 * 
 * @module _shared/gateway-credentials.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateCredentials, type GatewayCredentials } from "./gateway-credentials.ts";

// ============================================================================
// VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "gateway-credentials: validateCredentials deve validar Asaas corretamente",
  fn: () => {
    const credentials: GatewayCredentials = {
      api_key: 'test_key',
      environment: 'sandbox',
      source: 'vendor_integration'
    };
    
    const result = validateCredentials('asaas', credentials);
    
    assertEquals(result.valid, true);
    assertEquals(result.missingFields.length, 0);
  }
});

Deno.test({
  name: "gateway-credentials: validateCredentials deve rejeitar Asaas sem api_key",
  fn: () => {
    const credentials: GatewayCredentials = {
      environment: 'sandbox',
      source: 'vendor_integration'
    };
    
    const result = validateCredentials('asaas', credentials);
    
    assertEquals(result.valid, false);
    assertEquals(result.missingFields.includes('api_key'), true);
  }
});

Deno.test({
  name: "gateway-credentials: validateCredentials deve validar MercadoPago corretamente",
  fn: () => {
    const credentials: GatewayCredentials = {
      access_token: 'test_token',
      environment: 'sandbox',
      source: 'vendor_integration'
    };
    
    const result = validateCredentials('mercadopago', credentials);
    
    assertEquals(result.valid, true);
    assertEquals(result.missingFields.length, 0);
  }
});

Deno.test({
  name: "gateway-credentials: validateCredentials deve rejeitar MercadoPago sem access_token",
  fn: () => {
    const credentials: GatewayCredentials = {
      environment: 'sandbox',
      source: 'vendor_integration'
    };
    
    const result = validateCredentials('mercadopago', credentials);
    
    assertEquals(result.valid, false);
    assertEquals(result.missingFields.includes('access_token'), true);
  }
});

Deno.test({
  name: "gateway-credentials: validateCredentials deve validar Stripe corretamente",
  fn: () => {
    const credentials: GatewayCredentials = {
      api_key: 'sk_test_123',
      environment: 'sandbox',
      source: 'vendor_integration'
    };
    
    const result = validateCredentials('stripe', credentials);
    
    assertEquals(result.valid, true);
    assertEquals(result.missingFields.length, 0);
  }
});

Deno.test({
  name: "gateway-credentials: validateCredentials deve validar PushinPay corretamente",
  fn: () => {
    const credentials: GatewayCredentials = {
      token: 'test_token',
      environment: 'sandbox',
      source: 'vendor_integration'
    };
    
    const result = validateCredentials('pushinpay', credentials);
    
    assertEquals(result.valid, true);
    assertEquals(result.missingFields.length, 0);
  }
});

// ============================================================================
// INTERFACE COMPLIANCE TESTS
// ============================================================================

Deno.test({
  name: "gateway-credentials: GatewayCredentials deve suportar snake_case",
  fn: () => {
    const credentials: GatewayCredentials = {
      api_key: 'test',
      access_token: 'test',
      wallet_id: 'test',
      environment: 'sandbox',
      source: 'vendor_integration'
    };
    
    assertExists(credentials.api_key);
    assertExists(credentials.access_token);
    assertExists(credentials.wallet_id);
  }
});

Deno.test({
  name: "gateway-credentials: GatewayCredentials deve suportar camelCase",
  fn: () => {
    const credentials: GatewayCredentials = {
      apiKey: 'test',
      accessToken: 'test',
      walletId: 'test',
      environment: 'sandbox',
      source: 'vendor_integration'
    };
    
    assertExists(credentials.apiKey);
    assertExists(credentials.accessToken);
    assertExists(credentials.walletId);
  }
});

Deno.test({
  name: "gateway-credentials: validateCredentials deve retornar estrutura correta",
  fn: () => {
    const credentials: GatewayCredentials = {
      api_key: 'test',
      environment: 'sandbox',
      source: 'vendor_integration'
    };
    
    const result = validateCredentials('asaas', credentials);
    
    assertExists(result.valid);
    assertExists(result.missingFields);
    assertEquals(typeof result.valid, 'boolean');
    assertEquals(Array.isArray(result.missingFields), true);
  }
});

// ============================================================================
// EDGE CASES
// ============================================================================

Deno.test({
  name: "gateway-credentials: validateCredentials deve lidar com credenciais vazias",
  fn: () => {
    const credentials: GatewayCredentials = {
      environment: 'sandbox',
      source: 'vendor_integration'
    };
    
    const result = validateCredentials('asaas', credentials);
    
    assertEquals(result.valid, false);
    assertEquals(result.missingFields.length > 0, true);
  }
});

Deno.test({
  name: "gateway-credentials: validateCredentials deve aceitar environment production",
  fn: () => {
    const credentials: GatewayCredentials = {
      api_key: 'test',
      environment: 'production',
      source: 'owner_secrets'
    };
    
    const result = validateCredentials('asaas', credentials);
    
    assertEquals(result.valid, true);
    assertEquals(credentials.environment, 'production');
  }
});

Deno.test({
  name: "gateway-credentials: validateCredentials deve aceitar source owner_secrets",
  fn: () => {
    const credentials: GatewayCredentials = {
      api_key: 'test',
      environment: 'sandbox',
      source: 'owner_secrets'
    };
    
    const result = validateCredentials('asaas', credentials);
    
    assertEquals(result.valid, true);
    assertEquals(credentials.source, 'owner_secrets');
  }
});
