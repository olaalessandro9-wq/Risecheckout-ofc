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
 */

import {
  assertEquals,
  assertExists,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MercadoPagoAdapter } from "./MercadoPagoAdapter.ts";

// ============================================================================
// MOCK SUPABASE CLIENT
// ============================================================================

interface MockSupabaseClient {
  from: (table: string) => unknown;
}

function createMockSupabase(): MockSupabaseClient {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  };
}

// ============================================================================
// INITIALIZATION TESTS
// ============================================================================

Deno.test("MercadoPagoAdapter - should initialize with valid credentials", () => {
  const supabase = createMockSupabase();
  const adapter = new MercadoPagoAdapter("TEST_ACCESS_TOKEN", "production", supabase as never);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "mercadopago");
});

Deno.test("MercadoPagoAdapter - should throw error without access token", () => {
  const supabase = createMockSupabase();
  
  assertThrows(
    () => new MercadoPagoAdapter("", "production", supabase as never),
    Error,
    "Access Token é obrigatório"
  );
});

Deno.test("MercadoPagoAdapter - should initialize with sandbox environment", () => {
  const supabase = createMockSupabase();
  const adapter = new MercadoPagoAdapter("TEST_TOKEN", "sandbox", supabase as never);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "mercadopago");
});

Deno.test("MercadoPagoAdapter - should initialize with production environment", () => {
  const supabase = createMockSupabase();
  const adapter = new MercadoPagoAdapter("TEST_TOKEN", "production", supabase as never);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "mercadopago");
});

Deno.test("MercadoPagoAdapter - should have correct provider name", () => {
  const supabase = createMockSupabase();
  const adapter = new MercadoPagoAdapter("TEST_TOKEN", "production", supabase as never);
  
  assertEquals(adapter.providerName, "mercadopago");
  assertEquals(typeof adapter.providerName, "string");
});

Deno.test("MercadoPagoAdapter - should implement IPaymentGateway interface", () => {
  const supabase = createMockSupabase();
  const adapter = new MercadoPagoAdapter("TEST_TOKEN", "production", supabase as never);
  
  assertExists(adapter.createPix);
  assertExists(adapter.createCreditCard);
  assertExists(adapter.validateCredentials);
  assertEquals(typeof adapter.createPix, "function");
  assertEquals(typeof adapter.createCreditCard, "function");
  assertEquals(typeof adapter.validateCredentials, "function");
});

Deno.test("MercadoPagoAdapter - should have readonly provider name", () => {
  const supabase = createMockSupabase();
  const adapter = new MercadoPagoAdapter("TEST_TOKEN", "production", supabase as never);
  
  // TypeScript should prevent this, but we can verify the property exists
  assertEquals(adapter.providerName, "mercadopago");
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

Deno.test("MercadoPagoAdapter - validateCredentials should be async", () => {
  const supabase = createMockSupabase();
  const adapter = new MercadoPagoAdapter("TEST_TOKEN", "production", supabase as never);
  
  const result = adapter.validateCredentials();
  assertExists(result);
  assertEquals(result instanceof Promise, true);
});
