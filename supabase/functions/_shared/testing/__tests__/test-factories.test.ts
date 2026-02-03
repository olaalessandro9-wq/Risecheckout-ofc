/**
 * Tests for Test Factories
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Validates the data factory implementations.
 * 
 * @module _shared/testing/__tests__/test-factories.test
 */

import { assertEquals, assertExists, assertNotEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import {
  generateId,
  generatePrefixedId,
  createMockUser,
  createMockProducer,
  createMockAdmin,
  createMockOwner,
  createMockSession,
  createMockExpiredSession,
  createMockProduct,
  createMockCourseProduct,
  createMockOrder,
  createMockPaidOrder,
  createMockPixOrder,
  createMockAffiliate,
  createMockWebhook,
  createMockRequest,
  createAuthenticatedRequest,
  createInternalRequest,
} from "../mod.ts";

// ============================================================================
// ID GENERATOR TESTS
// ============================================================================

Deno.test("generateId: returns valid UUID format", () => {
  const id = generateId();
  
  assertExists(id);
  assertEquals(id.length, 36);
  assertEquals(id.split("-").length, 5);
});

Deno.test("generateId: generates unique IDs", () => {
  const id1 = generateId();
  const id2 = generateId();
  
  assertNotEquals(id1, id2);
});

Deno.test("generatePrefixedId: includes prefix", () => {
  const id = generatePrefixedId("user");
  
  assertEquals(id.startsWith("user-"), true);
});

// ============================================================================
// USER FACTORY TESTS
// ============================================================================

Deno.test("createMockUser: creates user with defaults", () => {
  const user = createMockUser();
  
  assertExists(user.id);
  assertExists(user.email);
  assertEquals(user.role, "user");
  assertEquals(user.account_status, "active");
  assertEquals(user.is_active, true);
});

Deno.test("createMockUser: accepts overrides", () => {
  const user = createMockUser({
    email: "custom@test.com",
    role: "admin",
  });
  
  assertEquals(user.email, "custom@test.com");
  assertEquals(user.role, "admin");
});

Deno.test("createMockProducer: creates user with producer defaults", () => {
  const producer = createMockProducer();
  
  assertEquals(producer.role, "user");
  assertEquals(producer.name, "Test Producer");
});

Deno.test("createMockAdmin: creates admin user", () => {
  const admin = createMockAdmin();
  
  assertEquals(admin.role, "admin");
});

Deno.test("createMockOwner: creates owner user", () => {
  const owner = createMockOwner();
  
  assertEquals(owner.role, "owner");
});

// ============================================================================
// SESSION FACTORY TESTS
// ============================================================================

Deno.test("createMockSession: creates session for user", () => {
  const user = createMockUser();
  const session = createMockSession(user.id);
  
  assertEquals(session.user_id, user.id);
  assertExists(session.access_token);
  assertExists(session.refresh_token);
  assertEquals(session.is_active, true);
});

Deno.test("createMockSession: has future expiration", () => {
  const session = createMockSession("user-123");
  const expiresAt = new Date(session.expires_at).getTime();
  const now = Date.now();
  
  assertEquals(expiresAt > now, true);
});

Deno.test("createMockExpiredSession: has past expiration", () => {
  const session = createMockExpiredSession("user-123");
  const expiresAt = new Date(session.expires_at).getTime();
  const now = Date.now();
  
  assertEquals(expiresAt < now, true);
});

// ============================================================================
// PRODUCT FACTORY TESTS
// ============================================================================

Deno.test("createMockProduct: creates product for user", () => {
  const userId = "vendor-123";
  const product = createMockProduct(userId);
  
  assertEquals(product.user_id, userId);
  assertExists(product.id);
  assertExists(product.name);
  assertEquals(product.status, "active");
  assertEquals(product.members_area_enabled, false);
});

Deno.test("createMockCourseProduct: enables members area", () => {
  const product = createMockCourseProduct("vendor-123");
  
  assertEquals(product.members_area_enabled, true);
  assertEquals(product.name, "Test Course");
});

// ============================================================================
// ORDER FACTORY TESTS
// ============================================================================

Deno.test("createMockOrder: creates pending order", () => {
  const order = createMockOrder("vendor-123", "product-456");
  
  assertEquals(order.vendor_id, "vendor-123");
  assertEquals(order.product_id, "product-456");
  assertEquals(order.status, "pending");
  assertEquals(order.paid_at, null);
});

Deno.test("createMockPaidOrder: creates paid order", () => {
  const order = createMockPaidOrder("vendor-123", "product-456");
  
  assertEquals(order.status, "paid");
  assertExists(order.paid_at);
  assertExists(order.gateway_payment_id);
});

Deno.test("createMockPixOrder: includes PIX data", () => {
  const order = createMockPixOrder("vendor-123", "product-456");
  
  assertEquals(order.payment_method, "pix");
  assertExists(order.pix_qr_code);
  assertExists(order.pix_code);
});

// ============================================================================
// AFFILIATE FACTORY TESTS
// ============================================================================

Deno.test("createMockAffiliate: creates approved affiliate", () => {
  const affiliate = createMockAffiliate("user-123", "product-456");
  
  assertEquals(affiliate.user_id, "user-123");
  assertEquals(affiliate.product_id, "product-456");
  assertEquals(affiliate.status, "approved");
  assertExists(affiliate.affiliate_code);
});

// ============================================================================
// WEBHOOK FACTORY TESTS
// ============================================================================

Deno.test("createMockWebhook: creates webhook with secret", () => {
  const webhook = createMockWebhook("user-123");
  
  assertEquals(webhook.user_id, "user-123");
  assertExists(webhook.secret);
  assertEquals(webhook.secret.startsWith("whsec_"), true);
  assertEquals(webhook.is_active, true);
});

// ============================================================================
// REQUEST FACTORY TESTS
// ============================================================================

Deno.test("createMockRequest: creates POST request by default", () => {
  const req = createMockRequest({ body: { test: true } });
  
  assertEquals(req.method, "POST");
  assertEquals(req.headers.get("Content-Type"), "application/json");
});

Deno.test("createMockRequest: supports custom method", () => {
  const req = createMockRequest({ method: "GET" });
  
  assertEquals(req.method, "GET");
});

Deno.test("createAuthenticatedRequest: includes session token as cookie", () => {
  const req = createAuthenticatedRequest({
    sessionToken: "test-token-123",
    body: { action: "list" },
  });
  
  const cookie = req.headers.get("Cookie");
  assertEquals(cookie?.includes("__Secure-rise_access=test-token-123"), true);
});

Deno.test("createAuthenticatedRequest: includes bearer token", () => {
  const req = createAuthenticatedRequest({
    bearerToken: "bearer-token-456",
  });
  
  assertEquals(req.headers.get("Authorization"), "Bearer bearer-token-456");
});

Deno.test("createInternalRequest: includes internal secret", () => {
  const req = createInternalRequest("secret-xyz", { body: { data: true } });
  
  assertEquals(req.headers.get("x-internal-secret"), "secret-xyz");
});
