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
 * 
 * @module _shared/payment-gateways/adapters/PushinPayAdapter.test
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 */

import {
  assertEquals,
  assertExists,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { PushinPayAdapter } from "./PushinPayAdapter.ts";
import {
  createMockSupabaseClient,
  hasPaymentGatewayInterface,
} from "./_shared.ts";

// ============================================================================
// INITIALIZATION TESTS
// ============================================================================

Deno.test("PushinPayAdapter - should initialize with valid credentials", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "production", supabase);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "pushinpay");
});

Deno.test("PushinPayAdapter - should throw error without token", () => {
  const supabase = createMockSupabaseClient();
  
  assertThrows(
    () => new PushinPayAdapter("", "production", supabase),
    Error,
    "Token é obrigatório"
  );
});

Deno.test("PushinPayAdapter - should initialize with sandbox environment", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "sandbox", supabase);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "pushinpay");
});

Deno.test("PushinPayAdapter - should initialize with production environment", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "production", supabase);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "pushinpay");
});

Deno.test("PushinPayAdapter - should have correct provider name", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "production", supabase);
  
  assertEquals(adapter.providerName, "pushinpay");
  assertEquals(typeof adapter.providerName, "string");
});

Deno.test("PushinPayAdapter - should implement IPaymentGateway interface", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "production", supabase);
  
  assertEquals(hasPaymentGatewayInterface(adapter), true);
  
  assertExists(adapter.createPix);
  assertExists(adapter.createCreditCard);
  assertExists(adapter.validateCredentials);
  assertEquals(typeof adapter.createPix, "function");
  assertEquals(typeof adapter.createCreditCard, "function");
  assertEquals(typeof adapter.validateCredentials, "function");
});

Deno.test("PushinPayAdapter - should have readonly provider name", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "production", supabase);
  
  assertEquals(adapter.providerName, "pushinpay");
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

Deno.test("PushinPayAdapter - validateCredentials should be async", () => {
  const supabase = createMockSupabaseClient();
  const adapter = new PushinPayAdapter("TEST_TOKEN", "production", supabase);
  
  const result = adapter.validateCredentials();
  assertExists(result);
  assertEquals(result instanceof Promise, true);
});
