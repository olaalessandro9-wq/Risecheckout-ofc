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
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { logSecurityViolation } from "./security-logging.ts";
import { SecurityViolation } from "./types.ts";

// ============================================================================
// MOCK SUPABASE CLIENT
// ============================================================================

interface MockInsertResult {
  error: Error | null;
}

interface MockFromChain {
  insert: (data: Record<string, unknown>) => MockInsertResult;
}

interface MockSupabaseClient {
  from: (table: string) => MockFromChain;
}

function createMockSupabase(shouldFail = false): MockSupabaseClient {
  return {
    from: (table: string) => ({
      insert: (data: Record<string, unknown>) => {
        if (shouldFail) {
          return { error: new Error("Database error") };
        }
        return { error: null };
      },
    }),
  };
}

// ============================================================================
// SECURITY LOGGING TESTS
// ============================================================================

Deno.test("logSecurityViolation - should log price tampering violation", async () => {
  const mockSupabase = createMockSupabase();
  
  const violation: SecurityViolation = {
    type: "price_tampering",
    orderId: "order-123",
    gateway: "mercadopago",
    expectedAmount: 10000,
    actualAmount: 5000,
    clientIp: "192.168.1.1",
    details: "Price mismatch detected",
  };

  // Should not throw
  await logSecurityViolation(mockSupabase as never, violation);
});

Deno.test("logSecurityViolation - should log order not found violation", async () => {
  const mockSupabase = createMockSupabase();
  
  const violation: SecurityViolation = {
    type: "order_not_found",
    orderId: "order-456",
    gateway: "stripe",
    clientIp: "10.0.0.1",
    details: "Order does not exist in database",
  };

  await logSecurityViolation(mockSupabase as never, violation);
});

Deno.test("logSecurityViolation - should log order status invalid violation", async () => {
  const mockSupabase = createMockSupabase();
  
  const violation: SecurityViolation = {
    type: "order_status_invalid",
    orderId: "order-789",
    gateway: "asaas",
    clientIp: "172.16.0.1",
    details: "Order status is 'completed'",
  };

  await logSecurityViolation(mockSupabase as never, violation);
});

Deno.test("logSecurityViolation - should log validation failed violation", async () => {
  const mockSupabase = createMockSupabase();
  
  const violation: SecurityViolation = {
    type: "validation_failed",
    orderId: "order-999",
    gateway: "mercadopago",
    details: "Customer data validation failed",
  };

  await logSecurityViolation(mockSupabase as never, violation);
});

Deno.test("logSecurityViolation - should handle missing optional fields", async () => {
  const mockSupabase = createMockSupabase();
  
  const violation: SecurityViolation = {
    type: "order_not_found",
    orderId: "order-minimal",
    gateway: "stripe",
  };

  await logSecurityViolation(mockSupabase as never, violation);
});

Deno.test("logSecurityViolation - should handle database errors gracefully", async () => {
  const mockSupabase = createMockSupabase(true);
  
  const violation: SecurityViolation = {
    type: "price_tampering",
    orderId: "order-error",
    gateway: "mercadopago",
    expectedAmount: 10000,
    actualAmount: 5000,
  };

  // Should not throw even if database fails
  await logSecurityViolation(mockSupabase as never, violation);
});

Deno.test("logSecurityViolation - should handle null clientIp", async () => {
  const mockSupabase = createMockSupabase();
  
  const violation: SecurityViolation = {
    type: "order_not_found",
    orderId: "order-no-ip",
    gateway: "stripe",
    clientIp: undefined,
  };

  await logSecurityViolation(mockSupabase as never, violation);
});

Deno.test("logSecurityViolation - should include timestamp in metadata", async () => {
  const mockSupabase = {
    from: (table: string) => ({
      insert: (data: Record<string, unknown>) => {
        assertExists(data.metadata);
        const metadata = data.metadata as Record<string, unknown>;
        assertExists(metadata.timestamp);
        assertEquals(typeof metadata.timestamp, "string");
        return { error: null };
      },
    }),
  };
  
  const violation: SecurityViolation = {
    type: "price_tampering",
    orderId: "order-timestamp",
    gateway: "mercadopago",
  };

  await logSecurityViolation(mockSupabase as never, violation);
});

Deno.test("logSecurityViolation - should include all violation data in metadata", async () => {
  const mockSupabase = {
    from: (table: string) => ({
      insert: (data: Record<string, unknown>) => {
        assertExists(data.metadata);
        const metadata = data.metadata as Record<string, unknown>;
        assertEquals(metadata.gateway, "mercadopago");
        assertEquals(metadata.expected_amount, 10000);
        assertEquals(metadata.actual_amount, 5000);
        assertEquals(metadata.details, "Test details");
        return { error: null };
      },
    }),
  };
  
  const violation: SecurityViolation = {
    type: "price_tampering",
    orderId: "order-full-data",
    gateway: "mercadopago",
    expectedAmount: 10000,
    actualAmount: 5000,
    details: "Test details",
  };

  await logSecurityViolation(mockSupabase as never, violation);
});

Deno.test("logSecurityViolation - should use correct table name", async () => {
  const mockSupabase = {
    from: (table: string) => {
      assertEquals(table, "security_audit_log");
      return {
        insert: (data: Record<string, unknown>) => ({ error: null }),
      };
    },
  };
  
  const violation: SecurityViolation = {
    type: "order_not_found",
    orderId: "order-table",
    gateway: "stripe",
  };

  await logSecurityViolation(mockSupabase as never, violation);
});

Deno.test("logSecurityViolation - should set entity_type to order", async () => {
  const mockSupabase = {
    from: (table: string) => ({
      insert: (data: Record<string, unknown>) => {
        assertEquals(data.entity_type, "order");
        return { error: null };
      },
    }),
  };
  
  const violation: SecurityViolation = {
    type: "price_tampering",
    orderId: "order-entity",
    gateway: "mercadopago",
  };

  await logSecurityViolation(mockSupabase as never, violation);
});

Deno.test("logSecurityViolation - should map violation type to action field", async () => {
  const mockSupabase = {
    from: (table: string) => ({
      insert: (data: Record<string, unknown>) => {
        assertEquals(data.action, "price_tampering");
        return { error: null };
      },
    }),
  };
  
  const violation: SecurityViolation = {
    type: "price_tampering",
    orderId: "order-action",
    gateway: "mercadopago",
  };

  await logSecurityViolation(mockSupabase as never, violation);
});

Deno.test("logSecurityViolation - should map orderId to entity_id field", async () => {
  const mockSupabase = {
    from: (table: string) => ({
      insert: (data: Record<string, unknown>) => {
        assertEquals(data.entity_id, "order-entity-id");
        return { error: null };
      },
    }),
  };
  
  const violation: SecurityViolation = {
    type: "order_not_found",
    orderId: "order-entity-id",
    gateway: "stripe",
  };

  await logSecurityViolation(mockSupabase as never, violation);
});
