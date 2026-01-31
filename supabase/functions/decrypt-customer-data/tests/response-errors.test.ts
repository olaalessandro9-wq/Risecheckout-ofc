/**
 * Response & Error Tests for decrypt-customer-data
 * 
 * @module decrypt-customer-data/tests/response-errors.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getIP, checkEncryptionKey, handleOrderResult } from "./_shared.ts";
import type { DecryptResponse, ErrorResponse, OrderResult, OrderRecord } from "./_shared.ts";

// ============================================================================
// RESPONSE STRUCTURE TESTS
// ============================================================================

Deno.test("Response - success structure", () => {
  const response: DecryptResponse = {
    success: true,
    data: {
      customer_phone: "11999998888",
      customer_document: "12345678901"
    },
    access_type: "vendor"
  };

  assertEquals(response.success, true);
  assertExists(response.data);
  assertExists(response.access_type);
});

Deno.test("Response - denied structure", () => {
  const response: ErrorResponse = {
    error: "Access denied: you don't have permission to view this data"
  };

  assertStringIncludes(response.error, "Access denied");
});

Deno.test("Response - not found structure", () => {
  const response: ErrorResponse = {
    error: "Order not found"
  };

  assertEquals(response.error, "Order not found");
});

// ============================================================================
// IP ADDRESS EXTRACTION TESTS
// ============================================================================

Deno.test("IP extraction - from x-forwarded-for", () => {
  const headers = new Headers();
  headers.set("x-forwarded-for", "203.0.113.50");
  
  assertEquals(getIP(headers), "203.0.113.50");
});

Deno.test("IP extraction - from cf-connecting-ip fallback", () => {
  const headers = new Headers();
  headers.set("cf-connecting-ip", "198.51.100.25");
  
  assertEquals(getIP(headers), "198.51.100.25");
});

Deno.test("IP extraction - no headers returns null", () => {
  const headers = new Headers();
  assertEquals(getIP(headers), null);
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test("Error handling - missing encryption key", () => {
  assertEquals(checkEncryptionKey(undefined).ok, false);
  assertEquals(checkEncryptionKey("").ok, false);
  assertEquals(checkEncryptionKey("valid-key").ok, true);
});

Deno.test("Error handling - encryption key error message", () => {
  const result = checkEncryptionKey(undefined);
  assertEquals(result.error, "BUYER_ENCRYPTION_KEY not configured");
});

Deno.test("Error handling - order not found", () => {
  const notFound: OrderResult = { data: null, error: null };
  assertEquals(handleOrderResult(notFound).status, 404);

  const error: OrderResult = { data: null, error: new Error("DB error") };
  assertEquals(handleOrderResult(error).status, 404);
});

Deno.test("Error handling - order found returns 200", () => {
  const order: OrderRecord = {
    id: "order-1",
    vendor_id: "vendor-1",
    customer_phone: "encrypted",
    customer_document: "encrypted",
    product: null
  };
  const found: OrderResult = { data: order, error: null };
  assertEquals(handleOrderResult(found).status, 200);
});
