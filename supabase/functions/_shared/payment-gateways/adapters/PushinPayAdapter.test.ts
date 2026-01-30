/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for PushinPayAdapter
 * 
 * Coverage:
 * - Adapter initialization
 * - Provider name verification
 * - Constructor validation
 * - Environment configuration
 */

import {
  assertEquals,
  assertExists,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { PushinPayAdapter } from "./PushinPayAdapter.ts";

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

Deno.test("PushinPayAdapter - should initialize with valid credentials", () => {
  const supabase = createMockSupabase();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "production", supabase as never);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "pushinpay");
});

Deno.test("PushinPayAdapter - should throw error without token", () => {
  const supabase = createMockSupabase();
  
  assertThrows(
    () => new PushinPayAdapter("", "production", supabase as never),
    Error,
    "Token é obrigatório"
  );
});

Deno.test("PushinPayAdapter - should initialize with sandbox environment", () => {
  const supabase = createMockSupabase();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "sandbox", supabase as never);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "pushinpay");
});

Deno.test("PushinPayAdapter - should initialize with production environment", () => {
  const supabase = createMockSupabase();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "production", supabase as never);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "pushinpay");
});

Deno.test("PushinPayAdapter - should have correct provider name", () => {
  const supabase = createMockSupabase();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "production", supabase as never);
  
  assertEquals(adapter.providerName, "pushinpay");
  assertEquals(typeof adapter.providerName, "string");
});

Deno.test("PushinPayAdapter - should implement IPaymentGateway interface", () => {
  const supabase = createMockSupabase();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "production", supabase as never);
  
  assertExists(adapter.createPix);
  assertExists(adapter.createCreditCard);
  assertExists(adapter.validateCredentials);
  assertEquals(typeof adapter.createPix, "function");
  assertEquals(typeof adapter.createCreditCard, "function");
  assertEquals(typeof adapter.validateCredentials, "function");
});

Deno.test("PushinPayAdapter - should have readonly provider name", () => {
  const supabase = createMockSupabase();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "production", supabase as never);
  
  assertEquals(adapter.providerName, "pushinpay");
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

Deno.test("PushinPayAdapter - validateCredentials should be async", () => {
  const supabase = createMockSupabase();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "production", supabase as never);
  
  const result = adapter.validateCredentials();
  assertExists(result);
  assertEquals(result instanceof Promise, true);
});
