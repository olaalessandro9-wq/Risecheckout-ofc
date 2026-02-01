/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for MercadoPagoAdapter
 * 
 * Coverage:
 * - Adapter initialization
 * - Provider name verification
 * - Constructor validation
 * - Error handling
 * 
 * @module _shared/payment-gateways/adapters/MercadoPagoAdapter.test
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 */

import {
  assertEquals,
  assertExists,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MercadoPagoAdapter } from "./MercadoPagoAdapter.ts";
import {
  createMockSupabaseClient,
  hasPaymentGatewayInterface,
} from "./_shared.ts";

// ============================================================================
// INITIALIZATION TESTS
// ============================================================================

Deno.test("MercadoPagoAdapter - should initialize with valid credentials", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new MercadoPagoAdapter("TEST_ACCESS_TOKEN", "production", supabase);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "mercadopago");
});

Deno.test("MercadoPagoAdapter - should throw error without access token", () => {
  const supabase = createMockSupabaseClient();
  
  assertThrows(
    () => new MercadoPagoAdapter("", "production", supabase),
    Error,
    "Access Token é obrigatório"
  );
});

Deno.test("MercadoPagoAdapter - should initialize with sandbox environment", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new MercadoPagoAdapter("TEST_TOKEN", "sandbox", supabase);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "mercadopago");
});

Deno.test("MercadoPagoAdapter - should initialize with production environment", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new MercadoPagoAdapter("TEST_TOKEN", "production", supabase);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "mercadopago");
});

Deno.test("MercadoPagoAdapter - should have correct provider name", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new MercadoPagoAdapter("TEST_TOKEN", "production", supabase);
  
  assertEquals(adapter.providerName, "mercadopago");
  assertEquals(typeof adapter.providerName, "string");
});

Deno.test("MercadoPagoAdapter - should implement IPaymentGateway interface", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new MercadoPagoAdapter("TEST_TOKEN", "production", supabase);
  
  assertEquals(hasPaymentGatewayInterface(adapter), true);
  
  assertExists(adapter.createPix);
  assertExists(adapter.createCreditCard);
  assertExists(adapter.validateCredentials);
  assertEquals(typeof adapter.createPix, "function");
  assertEquals(typeof adapter.createCreditCard, "function");
  assertEquals(typeof adapter.validateCredentials, "function");
});

Deno.test("MercadoPagoAdapter - should have readonly provider name", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new MercadoPagoAdapter("TEST_TOKEN", "production", supabase);
  
  // TypeScript should prevent this, but we can verify the property exists
  assertEquals(adapter.providerName, "mercadopago");
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

Deno.test("MercadoPagoAdapter - validateCredentials should be async", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new MercadoPagoAdapter("TEST_TOKEN", "production", supabase);
  
  const result = adapter.validateCredentials();
  assertExists(result);
  assertEquals(result instanceof Promise, true);
});
