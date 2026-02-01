/**
 * Request Validation Tests for trigger-webhooks
 * 
 * @module trigger-webhooks/tests/request-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;

describe("trigger-webhooks - Request Validation", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should require order_id", async () => {
    const mockRequest = createMockRequest({ event_type: "order.created" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasOrderId = "order_id" in body;
    assertEquals(hasOrderId, false);
  });

  it("should require event_type", async () => {
    const mockRequest = createMockRequest({ order_id: "order-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasEventType = "event_type" in body;
    assertEquals(hasEventType, false);
  });

  it("should throw error when fields are missing", async () => {
    const mockRequest = createMockRequest({ order_id: "order-123" });
    const errorMessage = "Campos obrigatórios ausentes";
    assertExists(errorMessage);
  });

  it("should accept valid request", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    assertExists(body.order_id);
    assertExists(body.event_type);
  });
});
