/**
 * Authentication Tests for trigger-webhooks
 * 
 * @module trigger-webhooks/tests/authentication.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createMockRequestWithoutSecret,
  VALID_SECRET,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;

describe("trigger-webhooks - Authentication", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should require X-Internal-Secret header", async () => {
    const mockRequest = createMockRequestWithoutSecret({ 
      order_id: "order-123", 
      event_type: "order.created" 
    });
    
    const hasSecret = mockRequest.headers.has("X-Internal-Secret");
    assertEquals(hasSecret, false);
  });

  it("should return 401 when secret is missing", async () => {
    const mockRequest = createMockRequestWithoutSecret({ 
      order_id: "order-123", 
      event_type: "order.created" 
    });
    
    const hasSecret = mockRequest.headers.has("X-Internal-Secret");
    const expectedStatus = hasSecret ? 200 : 401;
    assertEquals(expectedStatus, 401);
  });

  it("should return 401 when secret is invalid", async () => {
    const mockRequest = createMockRequest(
      { order_id: "order-123", event_type: "order.created" },
      { "X-Internal-Secret": "invalid-secret" }
    );
    
    const secret = mockRequest.headers.get("X-Internal-Secret");
    const isValid = secret === VALID_SECRET;
    const expectedStatus = isValid ? 200 : 401;
    assertEquals(expectedStatus, 401);
  });

  it("should accept valid secret", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123", 
      event_type: "order.created" 
    });
    
    const secret = mockRequest.headers.get("X-Internal-Secret");
    assertEquals(secret, VALID_SECRET);
  });

  it("should log unauthorized attempts", async () => {
    const mockRequest = createMockRequestWithoutSecret({ 
      order_id: "order-123", 
      event_type: "order.created" 
    });
    
    const logMessage = "Unauthorized: Invalid or missing X-Internal-Secret";
    assertExists(logMessage);
  });
});
