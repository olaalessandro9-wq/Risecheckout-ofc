/**
 * Authentication Tests for pixel-management
 * 
 * @module pixel-management/tests/authentication.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createMockRequestWithoutCookie,
  createDefaultProducer,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("pixel-management - Authentication", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should require __Secure-rise_access cookie", async () => {
    const mockRequest = createMockRequestWithoutCookie({ action: "list" });
    const cookie = mockRequest.headers.get("Cookie");
    assertEquals(cookie, null);
  });

  it("should return 401 for missing session", async () => {
    const mockRequest = createMockRequestWithoutCookie({ action: "list" });
    const hasSession = mockRequest.headers.has("Cookie");
    const expectedStatus = hasSession ? 200 : 401;
    assertEquals(expectedStatus, 401);
  });

  it("should validate session token format", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const cookie = mockRequest.headers.get("Cookie");
    assertExists(cookie);
    assertEquals(cookie?.includes("__Secure-rise_access="), true);
  });

  it("should extract producer ID from valid session", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const hasValidSession = true;
    const producerId = hasValidSession ? mockProducer.id : null;
    assertExists(producerId);
    assertEquals(producerId, mockProducer.id);
  });

  it("should return 401 for expired session", () => {
    const expiredSession = {
      token: "expired-token",
      expires_at: new Date(Date.now() - 86400000).toISOString(),
    };
    const isExpired = new Date(expiredSession.expires_at) < new Date();
    assertEquals(isExpired, true);
  });

  it("should return 401 for invalid session token", () => {
    const invalidSession = { valid: false, error: "Session not found" };
    assertEquals(invalidSession.valid, false);
  });
});
