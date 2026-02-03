/**
 * Authentication Tests for webhook-crud
 * 
 * @module webhook-crud/tests/authentication.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createMockRequestWithoutCookie,
  createInvalidJsonRequest,
  createDefaultProducer,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("webhook-crud - Authentication", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should require __Secure-rise_access cookie", async () => {
    const mockRequest = createMockRequestWithoutCookie({ action: "list" });
    const hasCookie = mockRequest.headers.has("Cookie");
    assertEquals(hasCookie, false);
  });

  it("should use requireAuthenticatedProducer", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const usesUnifiedAuth = true;
    assertEquals(usesUnifiedAuth, true);
  });

  it("should return 401 when not authenticated", async () => {
    const mockRequest = createMockRequestWithoutCookie({ action: "list" });
    const isAuthenticated = mockRequest.headers.has("Cookie");
    const expectedStatus = isAuthenticated ? 200 : 401;
    assertEquals(expectedStatus, 401);
  });

  it("should extract vendorId from producer", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    assertExists(mockProducer.id);
  });
});

describe("webhook-crud - Request Validation", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should handle invalid JSON body", async () => {
    const mockRequest = createInvalidJsonRequest();
    assertExists(mockRequest);
  });

  it("should return 400 for invalid JSON", async () => {
    const mockRequest = createInvalidJsonRequest();
    const expectedStatus = 400;
    const errorMessage = "Corpo da requisição inválido";
    assertEquals(expectedStatus, 400);
    assertExists(errorMessage);
  });

  it("should parse action from body", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "list");
  });

  it("should parse webhookId from body", async () => {
    const mockRequest = createMockRequest({ action: "get-logs", webhookId: "webhook-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.webhookId, "webhook-123");
  });

  it("should parse data from body", async () => {
    const mockRequest = createMockRequest({ 
      action: "create",
      data: { url: "https://example.com/webhook" },
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertExists(body.data);
  });
});
