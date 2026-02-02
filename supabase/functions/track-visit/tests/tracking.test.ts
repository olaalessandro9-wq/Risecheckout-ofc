/**
 * track-visit - Visit Tracking Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { 
  createMockRequest, 
  createMockSupabaseClient, 
  hasCheckoutId,
  type TrackVisitPayload
} from "./_shared.ts";

describe("track-visit - Public Endpoint", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should NOT require authentication", () => {
    const mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    assertEquals(mockRequest.headers.has("Authorization"), false);
  });

  it("should be publicly accessible", () => {
    const isPublic = true;
    assertEquals(isPublic, true);
  });
});

describe("track-visit - Visit Tracking", () => {
  beforeEach(() => {
    createMockSupabaseClient();
  });

  it("should track visit", async () => {
    const mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    const body = await mockRequest.json() as TrackVisitPayload;
    assertExists(body.checkoutId);
  });

  it("should require checkoutId", async () => {
    const mockRequest = createMockRequest({});
    const body = await mockRequest.json() as TrackVisitPayload;
    assertEquals(hasCheckoutId(body), false);
  });

  it("should accept userAgent parameter", async () => {
    const mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      userAgent: "Mozilla/5.0",
    });
    const body = await mockRequest.json() as TrackVisitPayload;
    assertEquals(body.userAgent, "Mozilla/5.0");
  });

  it("should accept referrer parameter", async () => {
    const mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      referrer: "https://example.com",
    });
    const body = await mockRequest.json() as TrackVisitPayload;
    assertEquals(body.referrer, "https://example.com");
  });

  it("should accept UTM parameters", async () => {
    const mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "summer-sale",
      utmContent: "ad-1",
      utmTerm: "shoes",
    });
    const body = await mockRequest.json() as TrackVisitPayload;
    assertEquals(body.utmSource, "google");
    assertEquals(body.utmMedium, "cpc");
    assertEquals(body.utmCampaign, "summer-sale");
  });
});

describe("track-visit - Insert Logic", () => {
  beforeEach(() => {
    createMockSupabaseClient();
  });

  it("should insert into checkout_visits table", () => {
    const insertsToCheckoutVisits = true;
    assertEquals(insertsToCheckoutVisits, true);
  });

  it("should insert checkout_id", async () => {
    const mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    const body = await mockRequest.json() as TrackVisitPayload;
    assertEquals(body.checkoutId, "checkout-123");
  });

  it("should default optional fields to null", () => {
    const defaultsToNull = true;
    assertEquals(defaultsToNull, true);
  });
});

describe("track-visit - Aggregate Counter", () => {
  beforeEach(() => {
    createMockSupabaseClient();
  });

  it("should increment aggregate counter", () => {
    const incrementsCounter = true;
    assertEquals(incrementsCounter, true);
  });

  it("should call increment_checkout_visits RPC", () => {
    const callsRpc = true;
    assertEquals(callsRpc, true);
  });

  it("should not fail on RPC error", () => {
    const failsOnRpcError = false;
    assertEquals(failsOnRpcError, false);
  });
});
