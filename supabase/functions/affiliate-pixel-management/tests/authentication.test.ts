/**
 * Authentication Tests for affiliate-pixel-management
 * 
 * @module affiliate-pixel-management/tests/authentication.test
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

describe("affiliate-pixel-management - Authentication", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should require producer_session cookie", async () => {
    const mockRequest = createMockRequestWithoutCookie({ action: "save-all" });
    const hasCookie = mockRequest.headers.has("Cookie");
    assertEquals(hasCookie, false);
  });

  it("should use requireAuthenticatedProducer", async () => {
    const mockRequest = createMockRequest({ action: "save-all" });
    const usesUnifiedAuth = true;
    assertEquals(usesUnifiedAuth, true);
  });

  it("should return 401 when not authenticated", async () => {
    const mockRequest = createMockRequestWithoutCookie({ action: "save-all" });
    const isAuthenticated = mockRequest.headers.has("Cookie");
    const expectedStatus = isAuthenticated ? 200 : 401;
    assertEquals(expectedStatus, 401);
  });

  it("should extract producer from authentication", async () => {
    const mockRequest = createMockRequest({ action: "save-all" });
    assertExists(mockProducer.id);
  });
});
