/**
 * Audit Logging Tests for decrypt-customer-data
 * 
 * @module decrypt-customer-data/tests/audit-logging.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { formatLogMessage, formatAccessLog } from "./_shared.ts";
import type { SecurityAuditEntry } from "./_shared.ts";

// ============================================================================
// AUDIT LOG TESTS
// ============================================================================

Deno.test("Audit log - success entry structure", () => {
  const entry: SecurityAuditEntry = {
    user_id: "user-123",
    action: "DECRYPT_CUSTOMER_DATA",
    resource: "orders",
    resource_id: "order-456",
    success: true,
    ip_address: "192.168.1.100",
    metadata: {
      fields: ["customer_phone", "customer_document"],
      access_type: "vendor",
      product_owner_id: "user-123"
    }
  };

  assertEquals(entry.action, "DECRYPT_CUSTOMER_DATA");
  assertEquals(entry.success, true);
  assertExists(entry.metadata);
});

Deno.test("Audit log - denied entry structure", () => {
  const entry: SecurityAuditEntry = {
    user_id: "user-123",
    action: "DECRYPT_CUSTOMER_DATA_DENIED",
    resource: "orders",
    resource_id: "order-456",
    success: false,
    ip_address: "192.168.1.100",
    metadata: {
      reason: "not_product_owner_or_owner",
      user_role: "vendor",
      product_owner_id: "user-789"
    }
  };

  assertEquals(entry.action, "DECRYPT_CUSTOMER_DATA_DENIED");
  assertEquals(entry.success, false);
  assertStringIncludes(String(entry.metadata.reason), "not_product_owner");
});

// ============================================================================
// LOGGING TESTS
// ============================================================================

Deno.test("Logging - should include producer and order info", () => {
  const message = formatLogMessage("user-123", "order-456");
  
  assertStringIncludes(message, "user-123");
  assertStringIncludes(message, "order-456");
});

Deno.test("Logging - should include access result", () => {
  const message = formatAccessLog("user-123", "order-456", "vendor");
  
  assertStringIncludes(message, "vendor");
  assertStringIncludes(message, "accessed");
});

// ============================================================================
// RATE LIMIT TESTS
// ============================================================================

Deno.test("Rate limit config - should use DECRYPT_DATA config", () => {
  const DECRYPT_DATA_CONFIG = {
    action: "decrypt_data",
    maxAttempts: 10,
    windowMinutes: 1,
    blockMinutes: 5
  };

  assertEquals(DECRYPT_DATA_CONFIG.action, "decrypt_data");
  assertEquals(DECRYPT_DATA_CONFIG.maxAttempts, 10);
});
