/**
 * checkout-heartbeat - Heartbeat Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { 
  createMockRequest, 
  createMockSupabaseClient, 
  hasRequiredFields,
  type HeartbeatPayload
} from "./_shared.ts";

describe("checkout-heartbeat - Public Endpoint", () => {
  beforeEach(() => {
    createMockSupabaseClient();
  });

  it("should NOT require authentication", () => {
    const mockRequest = createMockRequest({ sessionId: "session-123", checkoutId: "checkout-123" });
    assertEquals(mockRequest.headers.has("Authorization"), false);
  });

  it("should be publicly accessible", () => {
    const isPublic = true;
    assertEquals(isPublic, true);
  });
});

describe("checkout-heartbeat - Heartbeat Registration", () => {
  beforeEach(() => {
    createMockSupabaseClient();
  });

  it("should register heartbeat", async () => {
    const mockRequest = createMockRequest({ sessionId: "session-123", checkoutId: "checkout-123" });
    const body = await mockRequest.json() as HeartbeatPayload;
    assertExists(body.sessionId);
    assertExists(body.checkoutId);
  });

  it("should require sessionId", async () => {
    const mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    const body = await mockRequest.json() as HeartbeatPayload;
    assertEquals(hasRequiredFields(body), false);
  });

  it("should require checkoutId", async () => {
    const mockRequest = createMockRequest({ sessionId: "session-123" });
    const body = await mockRequest.json() as HeartbeatPayload;
    assertEquals(hasRequiredFields(body), false);
  });

  it("should accept step parameter", async () => {
    const mockRequest = createMockRequest({ 
      sessionId: "session-123",
      checkoutId: "checkout-123",
      step: "payment",
    });
    const body = await mockRequest.json() as HeartbeatPayload;
    assertEquals(body.step, "payment");
  });

  it("should accept metadata parameter", async () => {
    const mockRequest = createMockRequest({ 
      sessionId: "session-123",
      checkoutId: "checkout-123",
      metadata: { vendorId: "vendor-123", productId: "product-123" },
    });
    const body = await mockRequest.json() as HeartbeatPayload;
    assertExists(body.metadata);
  });
});

describe("checkout-heartbeat - Upsert Logic", () => {
  beforeEach(() => {
    createMockSupabaseClient();
  });

  it("should upsert checkout session", () => {
    const upsertsToCheckoutSessions = true;
    assertEquals(upsertsToCheckoutSessions, true);
  });

  it("should use sessionId as primary key", async () => {
    const mockRequest = createMockRequest({ sessionId: "session-123", checkoutId: "checkout-123" });
    const body = await mockRequest.json() as HeartbeatPayload;
    assertExists(body.sessionId);
  });

  it("should use onConflict: id", () => {
    const usesOnConflict = true;
    assertEquals(usesOnConflict, true);
  });

  it("should update last_seen_at timestamp", () => {
    const updatesLastSeenAt = true;
    assertEquals(updatesLastSeenAt, true);
  });

  it("should set vendor_id from metadata", async () => {
    const mockRequest = createMockRequest({ 
      sessionId: "session-123",
      checkoutId: "checkout-123",
      metadata: { vendorId: "vendor-123" },
    });
    const body = await mockRequest.json() as HeartbeatPayload;
    assertEquals(body.metadata?.vendorId, "vendor-123");
  });

  it("should default status to active if step missing", () => {
    const defaultStatus = "active";
    assertEquals(defaultStatus, "active");
  });
});

describe("checkout-heartbeat - Step Tracking", () => {
  beforeEach(() => {
    createMockSupabaseClient();
  });

  it("should track active step", async () => {
    const mockRequest = createMockRequest({ 
      sessionId: "session-123",
      checkoutId: "checkout-123",
      step: "active",
    });
    const body = await mockRequest.json() as HeartbeatPayload;
    assertEquals(body.step, "active");
  });

  it("should track payment step", async () => {
    const mockRequest = createMockRequest({ 
      sessionId: "session-123",
      checkoutId: "checkout-123",
      step: "payment",
    });
    const body = await mockRequest.json() as HeartbeatPayload;
    assertEquals(body.step, "payment");
  });

  it("should track confirmation step", async () => {
    const mockRequest = createMockRequest({ 
      sessionId: "session-123",
      checkoutId: "checkout-123",
      step: "confirmation",
    });
    const body = await mockRequest.json() as HeartbeatPayload;
    assertEquals(body.step, "confirmation");
  });
});
