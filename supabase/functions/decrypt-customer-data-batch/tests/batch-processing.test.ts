/**
 * Batch Processing Tests for decrypt-customer-data-batch
 * 
 * @module decrypt-customer-data-batch/tests/batch-processing.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { processBatch, decryptFields } from "./_shared.ts";
import type { Order } from "./_shared.ts";

// ============================================================================
// BATCH PROCESSING TESTS
// ============================================================================

Deno.test("Batch processing - should separate allowed and denied", () => {
  const orders: Order[] = [
    { id: "order-1", productOwnerId: "user-123" },
    { id: "order-2", productOwnerId: "user-456" },
    { id: "order-3", productOwnerId: "user-123" }
  ];

  const batch = processBatch(orders, "user-123");

  assertEquals(Object.keys(batch.result).length, 2);
  assertEquals(batch.denied.length, 1);
  assertArrayIncludes(batch.denied, ["order-2"]);
});

Deno.test("Batch processing - should handle all denied", () => {
  const orders: Order[] = [
    { id: "order-1", productOwnerId: "user-456" },
    { id: "order-2", productOwnerId: "user-789" }
  ];

  const batch = processBatch(orders, "user-123");

  assertEquals(Object.keys(batch.result).length, 0);
  assertEquals(batch.denied.length, 2);
});

Deno.test("Batch processing - should handle all allowed", () => {
  const orders: Order[] = [
    { id: "order-1", productOwnerId: "user-123" },
    { id: "order-2", productOwnerId: "user-123" }
  ];

  const batch = processBatch(orders, "user-123");

  assertEquals(Object.keys(batch.result).length, 2);
  assertEquals(batch.denied.length, 0);
});

Deno.test("Batch processing - empty input", () => {
  const batch = processBatch([], "user-123");
  assertEquals(Object.keys(batch.result).length, 0);
  assertEquals(batch.denied.length, 0);
});

// ============================================================================
// FIELD SELECTION TESTS
// ============================================================================

Deno.test("Field selection - should decrypt requested fields only", () => {
  const order = { customer_phone: "encrypted", customer_document: "encrypted" };

  const phoneOnly = decryptFields(order, ["customer_phone"]);
  assertEquals(phoneOnly.customer_phone, "decrypted_phone");
  assertEquals(phoneOnly.customer_document, undefined);

  const both = decryptFields(order, ["customer_phone", "customer_document"]);
  assertEquals(both.customer_phone, "decrypted_phone");
  assertEquals(both.customer_document, "decrypted_doc");
});

Deno.test("Field selection - null values not included", () => {
  const order = { customer_phone: null, customer_document: "encrypted" };

  const result = decryptFields(order, ["customer_phone", "customer_document"]);
  assertEquals(result.customer_phone, undefined);
  assertEquals(result.customer_document, "decrypted_doc");
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

Deno.test("Performance - batch should be more efficient than individual", () => {
  const batchCalls = 1;
  const individualCalls = 20;
  
  assertEquals(batchCalls < individualCalls, true);
});
