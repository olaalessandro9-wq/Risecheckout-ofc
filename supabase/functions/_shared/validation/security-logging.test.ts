/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for Security Logging
 * 
 * Coverage:
 * - Security violation logging
 * - Database insert operations
 * - Error handling
 * - Metadata structure
 * 
 * @module _shared/validation/security-logging.test
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { logSecurityViolation } from "./security-logging.ts";
import {
  createMockSupabase,
  createPriceTamperingViolation,
  createOrderNotFoundViolation,
  createOrderStatusInvalidViolation,
  createValidationFailedViolation,
  createMinimalViolation,
} from "./_shared.ts";

// ============================================================================
// SECURITY LOGGING TESTS
// ============================================================================

Deno.test("logSecurityViolation - should log price tampering violation", async () => {
  const mockSupabase = createMockSupabase();
  const violation = createPriceTamperingViolation({ orderId: "order-123" });

  // Should not throw
  await logSecurityViolation(mockSupabase, violation);
});

Deno.test("logSecurityViolation - should log order not found violation", async () => {
  const mockSupabase = createMockSupabase();
  const violation = createOrderNotFoundViolation({ orderId: "order-456" });

  await logSecurityViolation(mockSupabase, violation);
});

Deno.test("logSecurityViolation - should log order status invalid violation", async () => {
  const mockSupabase = createMockSupabase();
  const violation = createOrderStatusInvalidViolation({ orderId: "order-789" });

  await logSecurityViolation(mockSupabase, violation);
});

Deno.test("logSecurityViolation - should log validation failed violation", async () => {
  const mockSupabase = createMockSupabase();
  const violation = createValidationFailedViolation({ orderId: "order-999" });

  await logSecurityViolation(mockSupabase, violation);
});

Deno.test("logSecurityViolation - should handle missing optional fields", async () => {
  const mockSupabase = createMockSupabase();
  const violation = createMinimalViolation({ orderId: "order-minimal" });

  await logSecurityViolation(mockSupabase, violation);
});

Deno.test("logSecurityViolation - should handle database errors gracefully", async () => {
  const mockSupabase = createMockSupabase({ shouldFail: true });
  const violation = createPriceTamperingViolation({ orderId: "order-error" });

  // Should not throw even if database fails
  await logSecurityViolation(mockSupabase, violation);
});

Deno.test("logSecurityViolation - should handle null clientIp", async () => {
  const mockSupabase = createMockSupabase();
  const violation = createMinimalViolation({
    orderId: "order-no-ip",
    clientIp: undefined,
  });

  await logSecurityViolation(mockSupabase, violation);
});

Deno.test("logSecurityViolation - should include timestamp in metadata", async () => {
  let capturedMetadata: Record<string, unknown> = {};
  
  const mockSupabase = createMockSupabase({
    onInsert: (_table, data) => {
      capturedMetadata = data.metadata as Record<string, unknown>;
    },
  });

  const violation = createPriceTamperingViolation({ orderId: "order-timestamp" });
  await logSecurityViolation(mockSupabase, violation);
  
  assertExists(capturedMetadata);
  assertExists(capturedMetadata.timestamp);
  assertEquals(typeof capturedMetadata.timestamp, "string");
});

Deno.test("logSecurityViolation - should include all violation data in metadata", async () => {
  let capturedMetadata: Record<string, unknown> = {};
  
  const mockSupabase = createMockSupabase({
    onInsert: (_table, data) => {
      capturedMetadata = data.metadata as Record<string, unknown>;
    },
  });

  const violation = createPriceTamperingViolation({
    orderId: "order-full-data",
    gateway: "mercadopago",
    expectedAmount: 10000,
    actualAmount: 5000,
    details: "Test details",
  });

  await logSecurityViolation(mockSupabase, violation);
  
  assertExists(capturedMetadata);
  assertEquals(capturedMetadata.gateway, "mercadopago");
  assertEquals(capturedMetadata.expected_amount, 10000);
  assertEquals(capturedMetadata.actual_amount, 5000);
  assertEquals(capturedMetadata.details, "Test details");
});

Deno.test("logSecurityViolation - should use correct table name", async () => {
  let capturedTable = "";
  
  const mockSupabase = createMockSupabase({
    onFrom: (tableName) => {
      capturedTable = tableName;
    },
  });

  const violation = createMinimalViolation({ orderId: "order-table" });
  await logSecurityViolation(mockSupabase, violation);
  
  assertEquals(capturedTable, "security_audit_log");
});

Deno.test("logSecurityViolation - should set entity_type to order", async () => {
  let capturedData: Record<string, unknown> = {};
  
  const mockSupabase = createMockSupabase({
    onInsert: (_table, data) => {
      capturedData = data;
    },
  });

  const violation = createPriceTamperingViolation({ orderId: "order-entity" });
  await logSecurityViolation(mockSupabase, violation);
  
  assertExists(capturedData);
  assertEquals(capturedData.entity_type, "order");
});

Deno.test("logSecurityViolation - should map violation type to action field", async () => {
  let capturedData: Record<string, unknown> = {};
  
  const mockSupabase = createMockSupabase({
    onInsert: (_table, data) => {
      capturedData = data;
    },
  });

  const violation = createPriceTamperingViolation({ orderId: "order-action" });
  await logSecurityViolation(mockSupabase, violation);
  
  assertExists(capturedData);
  assertEquals(capturedData.action, "price_tampering");
});

Deno.test("logSecurityViolation - should map orderId to entity_id field", async () => {
  let capturedData: Record<string, unknown> = {};
  
  const mockSupabase = createMockSupabase({
    onInsert: (_table, data) => {
      capturedData = data;
    },
  });

  const violation = createMinimalViolation({ orderId: "order-entity-id" });
  await logSecurityViolation(mockSupabase, violation);
  
  assertExists(capturedData);
  assertEquals(capturedData.entity_id, "order-entity-id");
});
