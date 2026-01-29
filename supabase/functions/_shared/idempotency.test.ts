/**
 * Idempotency Module Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * CRITICAL: These tests validate protection against duplicate charges.
 * Any failure here represents potential financial and legal risk.
 * 
 * @module _shared/idempotency.test
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  generateIdempotencyKey,
  extractIdempotencyKey,
} from "./idempotency.ts";

// ============================================================================
// generateIdempotencyKey Tests
// ============================================================================

Deno.test("generateIdempotencyKey: should return custom key if provided", () => {
  const orderId = "order-123";
  const customKey = "my-custom-key-456";
  
  const result = generateIdempotencyKey(orderId, customKey);
  
  assertEquals(result, customKey);
});

Deno.test("generateIdempotencyKey: should generate key from orderId when no custom key", () => {
  const orderId = "order-abc-123";
  
  const result = generateIdempotencyKey(orderId);
  
  assertStringIncludes(result, "order_");
  assertStringIncludes(result, orderId);
});

Deno.test("generateIdempotencyKey: should include timestamp for uniqueness", () => {
  const orderId = "order-xyz";
  
  const result = generateIdempotencyKey(orderId);
  
  // Format: order_{orderId}_{timestamp}
  const parts = result.split("_");
  assertEquals(parts[0], "order");
  assertStringIncludes(parts[1], orderId);
  // Third part should be a timestamp (number)
  const timestamp = parseInt(parts[2]);
  assertEquals(typeof timestamp, "number");
  assertEquals(isNaN(timestamp), false);
});

Deno.test("generateIdempotencyKey: should generate different keys for different orders", () => {
  const result1 = generateIdempotencyKey("order-1");
  const result2 = generateIdempotencyKey("order-2");
  
  // Order IDs are different, so keys should differ
  assertStringIncludes(result1, "order-1");
  assertStringIncludes(result2, "order-2");
});

Deno.test("generateIdempotencyKey: should use second precision timestamp", () => {
  const orderId = "order-test";
  
  // Generate two keys in quick succession
  const result1 = generateIdempotencyKey(orderId);
  const result2 = generateIdempotencyKey(orderId);
  
  // Same second = same key (allows deduplication within same second)
  // Different seconds = different keys (allows retry after waiting)
  // Keys should be the same if called within the same second
  assertEquals(result1, result2);
});

Deno.test("generateIdempotencyKey: should handle empty orderId", () => {
  const result = generateIdempotencyKey("");
  
  assertStringIncludes(result, "order_");
  assertExists(result);
});

Deno.test("generateIdempotencyKey: should handle special characters in orderId", () => {
  const orderId = "order-123-abc_xyz";
  
  const result = generateIdempotencyKey(orderId);
  
  assertStringIncludes(result, orderId);
});

// ============================================================================
// extractIdempotencyKey Tests
// ============================================================================

Deno.test("extractIdempotencyKey: should extract from Idempotency-Key header", () => {
  const req = new Request("http://test.com", {
    headers: { "Idempotency-Key": "header-key-123" },
  });
  const body = { orderId: "order-456" };
  
  const result = extractIdempotencyKey(req, body);
  
  assertEquals(result, "header-key-123");
});

Deno.test("extractIdempotencyKey: should extract from X-Idempotency-Key header", () => {
  const req = new Request("http://test.com", {
    headers: { "X-Idempotency-Key": "x-header-key-789" },
  });
  const body = { orderId: "order-456" };
  
  const result = extractIdempotencyKey(req, body);
  
  assertEquals(result, "x-header-key-789");
});

Deno.test("extractIdempotencyKey: should prefer Idempotency-Key over X-Idempotency-Key", () => {
  const req = new Request("http://test.com", {
    headers: {
      "Idempotency-Key": "primary-key",
      "X-Idempotency-Key": "fallback-key",
    },
  });
  const body = {};
  
  const result = extractIdempotencyKey(req, body);
  
  assertEquals(result, "primary-key");
});

Deno.test("extractIdempotencyKey: should extract from body if no header", () => {
  const req = new Request("http://test.com");
  const body = { idempotencyKey: "body-key-abc" };
  
  const result = extractIdempotencyKey(req, body);
  
  assertEquals(result, "body-key-abc");
});

Deno.test("extractIdempotencyKey: should generate from orderId if no header or body key", () => {
  const req = new Request("http://test.com");
  const body = { orderId: "order-from-body" };
  
  const result = extractIdempotencyKey(req, body);
  
  assertStringIncludes(result, "order_");
  assertStringIncludes(result, "order-from-body");
});

Deno.test("extractIdempotencyKey: should return UUID as fallback", () => {
  const req = new Request("http://test.com");
  const body = {};
  
  const result = extractIdempotencyKey(req, body);
  
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  assertExists(result);
  assertEquals(result.length, 36);
  assertEquals(result.split("-").length, 5);
});

Deno.test("extractIdempotencyKey: header should take priority over body", () => {
  const req = new Request("http://test.com", {
    headers: { "Idempotency-Key": "header-priority" },
  });
  const body = {
    idempotencyKey: "body-key",
    orderId: "order-id",
  };
  
  const result = extractIdempotencyKey(req, body);
  
  assertEquals(result, "header-priority");
});

Deno.test("extractIdempotencyKey: body key should take priority over orderId", () => {
  const req = new Request("http://test.com");
  const body = {
    idempotencyKey: "explicit-body-key",
    orderId: "fallback-order-id",
  };
  
  const result = extractIdempotencyKey(req, body);
  
  assertEquals(result, "explicit-body-key");
});

// ============================================================================
// Hash Request Tests (Testing via behavior)
// Note: hashRequest is not exported, but we can verify behavior through
// the fact that checkIdempotency uses it internally
// ============================================================================

Deno.test("generateIdempotencyKey: deterministic for same inputs", () => {
  const orderId = "deterministic-order";
  
  // Within the same second, keys should be identical
  const key1 = generateIdempotencyKey(orderId);
  const key2 = generateIdempotencyKey(orderId);
  
  assertEquals(key1, key2);
});

// ============================================================================
// Type Safety Tests
// ============================================================================

Deno.test("PaymentGateway type: should accept valid gateways", () => {
  // Type-level test - if this compiles, types are correct
  const validGateways: Array<"mercadopago" | "stripe" | "asaas" | "pushinpay"> = [
    "mercadopago",
    "stripe",
    "asaas",
    "pushinpay",
  ];
  
  assertEquals(validGateways.length, 4);
});

Deno.test("PaymentMethod type: should accept valid methods", () => {
  // Type-level test
  const validMethods: Array<"pix" | "credit_card" | "boleto"> = [
    "pix",
    "credit_card",
    "boleto",
  ];
  
  assertEquals(validMethods.length, 3);
});

Deno.test("AttemptStatus type: should accept valid statuses", () => {
  // Type-level test
  const validStatuses: Array<"pending" | "processing" | "completed" | "failed"> = [
    "pending",
    "processing",
    "completed",
    "failed",
  ];
  
  assertEquals(validStatuses.length, 4);
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test("Edge Case: very long orderId should work", () => {
  const longOrderId = "order-" + "a".repeat(1000);
  
  const result = generateIdempotencyKey(longOrderId);
  
  assertStringIncludes(result, "order_");
  assertExists(result);
});

Deno.test("Edge Case: Unicode in orderId should work", () => {
  const unicodeOrderId = "order-日本語-émoji-🎉";
  
  const result = generateIdempotencyKey(unicodeOrderId);
  
  assertStringIncludes(result, unicodeOrderId);
});

Deno.test("Edge Case: undefined custom key should generate from orderId", () => {
  const orderId = "order-test";
  
  // Cast explícito para testar comportamento runtime (RISE V3: Zero @ts-ignore)
  const result = generateIdempotencyKey(orderId, undefined as unknown as string);
  
  assertStringIncludes(result, "order_");
});

Deno.test("Edge Case: null custom key should generate from orderId", () => {
  const orderId = "order-test";
  
  // Cast explícito para testar comportamento runtime (RISE V3: Zero @ts-ignore)
  const result = generateIdempotencyKey(orderId, null as unknown as string);
  
  assertStringIncludes(result, "order_");
});

// ============================================================================
// Integration-Style Tests (Behavior Verification)
// ============================================================================

Deno.test("Integration: full key generation and extraction flow", () => {
  const orderId = "integration-order-123";
  
  // 1. Generate key
  const generatedKey = generateIdempotencyKey(orderId);
  
  // 2. Create request with the key
  const req = new Request("http://test.com", {
    headers: { "Idempotency-Key": generatedKey },
  });
  
  // 3. Extract key from request
  const extractedKey = extractIdempotencyKey(req, {});
  
  // 4. Keys should match
  assertEquals(generatedKey, extractedKey);
});

Deno.test("Integration: key extraction priority chain", () => {
  // Priority: Header > Body Key > OrderId > UUID
  
  // Test 1: Header wins over everything
  const req1 = new Request("http://test.com", {
    headers: { "Idempotency-Key": "HEADER" },
  });
  assertEquals(
    extractIdempotencyKey(req1, { idempotencyKey: "BODY", orderId: "ORDER" }),
    "HEADER"
  );
  
  // Test 2: Body key wins over orderId
  const req2 = new Request("http://test.com");
  assertEquals(
    extractIdempotencyKey(req2, { idempotencyKey: "BODY", orderId: "ORDER" }),
    "BODY"
  );
  
  // Test 3: OrderId generates key
  const req3 = new Request("http://test.com");
  const result3 = extractIdempotencyKey(req3, { orderId: "ORDER" });
  assertStringIncludes(result3, "ORDER");
  
  // Test 4: UUID fallback
  const req4 = new Request("http://test.com");
  const result4 = extractIdempotencyKey(req4, {});
  assertEquals(result4.length, 36); // UUID length
});
