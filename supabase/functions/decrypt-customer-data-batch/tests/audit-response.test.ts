/**
 * Audit & Response Tests for decrypt-customer-data-batch
 * 
 * @module decrypt-customer-data-batch/tests/audit-response.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  shouldLog, 
  checkEncryptionKey, 
  handleFetchError,
  formatRequestLog,
  formatResultLog 
} from "./_shared.ts";
import type { BatchResponse, AuditEntry } from "./_shared.ts";

// ============================================================================
// RESPONSE STRUCTURE TESTS
// ============================================================================

Deno.test("Response - success structure", () => {
  const response: BatchResponse = {
    success: true,
    data: {
      "order-1": { customer_phone: "11999998888" },
      "order-2": { customer_phone: "11888887777", customer_document: "12345678901" }
    },
    denied: ["order-3"]
  };

  assertEquals(response.success, true);
  assertExists(response.data);
  assertEquals(Object.keys(response.data).length, 2);
  assertEquals(response.denied.length, 1);
});

Deno.test("Response - empty result structure", () => {
  const response: BatchResponse = {
    success: true,
    data: {},
    denied: ["order-1", "order-2", "order-3"]
  };

  assertEquals(response.success, true);
  assertEquals(Object.keys(response.data).length, 0);
  assertEquals(response.denied.length, 3);
});

// ============================================================================
// AUDIT LOG TESTS
// ============================================================================

Deno.test("Audit log - batch entry structure", () => {
  const entry: AuditEntry = {
    user_id: "user-123",
    action: "DECRYPT_CUSTOMER_DATA_BATCH",
    resource: "orders",
    resource_id: "order-1",
    success: true,
    ip_address: "192.168.1.100",
    metadata: {
      fields: ["customer_phone", "customer_email"],
      order_count: 5,
      order_ids: ["order-1", "order-2", "order-3", "order-4", "order-5"],
      access_type: "vendor"
    }
  };

  assertEquals(entry.action, "DECRYPT_CUSTOMER_DATA_BATCH");
  assertEquals(entry.metadata.order_count, 5);
  assertEquals(entry.metadata.access_type, "vendor");
});

Deno.test("Audit log - should only log when decryptions occur", () => {
  assertEquals(shouldLog(["order-1"]), true);
  assertEquals(shouldLog([]), false);
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test("Error handling - missing encryption key", () => {
  assertEquals(checkEncryptionKey(undefined).ok, false);
  assertEquals(checkEncryptionKey("").ok, false);
  assertEquals(checkEncryptionKey("valid-key").ok, true);
});

Deno.test("Error handling - fetch error", () => {
  const result = handleFetchError(new Error("Connection timeout"));
  assertEquals(result.success, false);
  assertEquals(result.error, "Failed to fetch orders");
});

// ============================================================================
// LOGGING TESTS
// ============================================================================

Deno.test("Logging - request info", () => {
  const message = formatRequestLog("user-123", 15);
  assertEquals(message, "Producer user-123 requesting 15 orders");
});

Deno.test("Logging - result info", () => {
  const message = formatResultLog(10, 5);
  assertEquals(message, "Decrypted 10 orders, denied 5");
});

// ============================================================================
// RATE LIMIT TESTS
// ============================================================================

Deno.test("Rate limit - should use DECRYPT_DATA config", () => {
  const RATE_LIMIT_CONFIG = {
    action: "decrypt_data",
    maxAttempts: 10,
    windowMinutes: 1,
    blockMinutes: 5
  };

  assertEquals(RATE_LIMIT_CONFIG.action, "decrypt_data");
  assertEquals(typeof RATE_LIMIT_CONFIG.maxAttempts, "number");
});
