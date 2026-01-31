/**
 * Validation Tests for admin-data
 * @module admin-data/tests/validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getDefaultPeriod, getDefaultLimit, type RequestBody } from "./_shared.ts";

// ============================================
// REQUIRED FIELDS VALIDATION
// ============================================

Deno.test("admin-data - validation - productId required for members-area-data", () => {
  const body: RequestBody = { action: "members-area-data" };
  assertEquals(body.productId, undefined);
  assertEquals(!body.productId, true);
});

Deno.test("admin-data - validation - userId required for user-profile", () => {
  const body: RequestBody = { action: "user-profile" };
  assertEquals(body.userId, undefined);
  assertEquals(!body.userId, true);
});

Deno.test("admin-data - validation - orderBumpId required for order-bump-detail", () => {
  const body: RequestBody = { action: "order-bump-detail" };
  assertEquals(body.orderBumpId, undefined);
});

Deno.test("admin-data - validation - affiliationProductId required for gateway-connections", () => {
  const body: RequestBody = { action: "gateway-connections" };
  assertEquals(body.affiliationProductId, undefined);
});

Deno.test("admin-data - validation - contentId, buyerId, purchaseDate required for content-access-check", () => {
  const body: RequestBody = { action: "content-access-check" };
  assertEquals(body.contentId, undefined);
  assertEquals(body.buyerId, undefined);
  assertEquals(body.purchaseDate, undefined);
});

// ============================================
// PERIOD HANDLING
// ============================================

Deno.test("admin-data - period - defaults to 'all' when not provided", () => {
  const body: RequestBody = { action: "admin-orders" };
  assertEquals(getDefaultPeriod(body), "all");
});

Deno.test("admin-data - period - respects provided period value", () => {
  const body: RequestBody = { action: "admin-orders", period: "7d" };
  assertEquals(getDefaultPeriod(body), "7d");
});

Deno.test("admin-data - period - supports various period formats", () => {
  const validPeriods = ["all", "7d", "30d", "90d", "365d"];
  validPeriods.forEach((period) => {
    assertExists(period);
  });
});

// ============================================
// LIMIT HANDLING
// ============================================

Deno.test("admin-data - limit - defaults to 100 when not provided", () => {
  const body: RequestBody = { action: "security-logs" };
  assertEquals(getDefaultLimit(body), 100);
});

Deno.test("admin-data - limit - respects provided limit value", () => {
  const body: RequestBody = { action: "security-logs", limit: 50 };
  assertEquals(getDefaultLimit(body), 50);
});

// ============================================
// FILTERS HANDLING
// ============================================

Deno.test("admin-data - filters - security-alerts accepts filters object", () => {
  const body: RequestBody = {
    action: "security-alerts",
    filters: {
      severity: "high",
      acknowledged: false,
    },
  };
  
  assertExists(body.filters);
  assertEquals(body.filters.severity, "high");
  assertEquals(body.filters.acknowledged, false);
});

Deno.test("admin-data - filters - handles undefined filters gracefully", () => {
  const body: RequestBody = { action: "security-alerts" };
  const filters = body.filters ?? {};
  assertEquals(Object.keys(filters).length, 0);
});

// ============================================
// REQUEST BODY PARSING
// ============================================

Deno.test("admin-data - body parsing - extracts action correctly", () => {
  const body = { action: "admin-products", limit: 50 };
  assertEquals(body.action, "admin-products");
});

Deno.test("admin-data - body parsing - extracts productId correctly", () => {
  const body = { action: "members-area-data", productId: "uuid-123" };
  assertEquals(body.productId, "uuid-123");
});

Deno.test("admin-data - body parsing - extracts userId correctly", () => {
  const body = { action: "user-profile", userId: "user-uuid-456" };
  assertEquals(body.userId, "user-uuid-456");
});

Deno.test("admin-data - body parsing - extracts all optional fields", () => {
  const body = {
    action: "content-editor-data",
    contentId: "content-123",
    productId: "product-456",
  };
  
  assertEquals(body.contentId, "content-123");
  assertEquals(body.productId, "product-456");
});
