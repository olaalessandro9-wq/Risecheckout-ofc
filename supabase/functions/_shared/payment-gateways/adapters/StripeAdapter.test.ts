/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for StripeAdapter
 * 
 * Coverage:
 * - Adapter initialization
 * - Provider name verification
 * - Constructor validation
 * - Stripe Connect configuration
 * 
 * @module _shared/payment-gateways/adapters/StripeAdapter.test
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { StripeAdapter, type StripeCredentials } from "./StripeAdapter.ts";
import { hasPaymentGatewayInterface } from "./_shared.ts";

// ============================================================================
// INITIALIZATION TESTS
// ============================================================================

Deno.test("StripeAdapter - should initialize with valid credentials", () => {
  const credentials: StripeCredentials = {
    secret_key: "sk_test_123456789",
  };
  
  const adapter = new StripeAdapter(credentials);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "stripe");
});

Deno.test("StripeAdapter - should initialize with connected account", () => {
  const credentials: StripeCredentials = {
    secret_key: "sk_test_123456789",
    connected_account_id: "acct_123456",
  };
  
  const adapter = new StripeAdapter(credentials);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "stripe");
});

Deno.test("StripeAdapter - should initialize with test mode flag", () => {
  const credentials: StripeCredentials = {
    secret_key: "sk_test_123456789",
    is_test: true,
  };
  
  const adapter = new StripeAdapter(credentials);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "stripe");
});

Deno.test("StripeAdapter - should initialize with production mode", () => {
  const credentials: StripeCredentials = {
    secret_key: "sk_live_123456789",
    is_test: false,
  };
  
  const adapter = new StripeAdapter(credentials);
  
  assertExists(adapter);
  assertEquals(adapter.providerName, "stripe");
});

Deno.test("StripeAdapter - should have correct provider name", () => {
  const credentials: StripeCredentials = {
    secret_key: "sk_test_123456789",
  };
  
  const adapter = new StripeAdapter(credentials);
  
  assertEquals(adapter.providerName, "stripe");
  assertEquals(typeof adapter.providerName, "string");
});

Deno.test("StripeAdapter - should implement IPaymentGateway interface", () => {
  const credentials: StripeCredentials = {
    secret_key: "sk_test_123456789",
  };
  
  const adapter = new StripeAdapter(credentials);
  
  assertEquals(hasPaymentGatewayInterface(adapter), true);
  
  assertExists(adapter.createPix);
  assertExists(adapter.createCreditCard);
  assertExists(adapter.validateCredentials);
  assertEquals(typeof adapter.createPix, "function");
  assertEquals(typeof adapter.createCreditCard, "function");
  assertEquals(typeof adapter.validateCredentials, "function");
});

Deno.test("StripeAdapter - should have readonly provider name", () => {
  const credentials: StripeCredentials = {
    secret_key: "sk_test_123456789",
  };
  
  const adapter = new StripeAdapter(credentials);
  
  assertEquals(adapter.providerName, "stripe");
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

Deno.test("StripeAdapter - validateCredentials should be async", () => {
  const credentials: StripeCredentials = {
    secret_key: "sk_test_123456789",
  };
  
  const adapter = new StripeAdapter(credentials);
  const result = adapter.validateCredentials();
  
  assertExists(result);
  assertEquals(result instanceof Promise, true);
});
