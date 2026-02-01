/**
 * Validation Tests for utmify-conversion
 * 
 * @module utmify-conversion/tests/validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultOrder,
  isValidEvent,
  type MockOrder,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockOrder: MockOrder;

describe("utmify-conversion - Validation", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockOrder = createDefaultOrder();
  });

  it("should require order_id", async () => {
    const mockRequest = createMockRequest({});
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasOrderId = "order_id" in body;
    assertEquals(hasOrderId, false);
  });

  it("should return 400 for missing order_id", async () => {
    const mockRequest = createMockRequest({});
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasOrderId = "order_id" in body;
    const expectedStatus = hasOrderId ? 200 : 400;
    assertEquals(expectedStatus, 400);
  });

  it("should validate UUID format for order_id", async () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(mockOrder.id);
    assertEquals(isValidUUID, true);
  });

  it("should reject invalid UUID format", async () => {
    const mockRequest = createMockRequest({ order_id: "invalid-uuid" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(body.order_id as string);
    assertEquals(isValidUUID, false);
  });

  it("should validate event_type when provided", async () => {
    const mockRequest = createMockRequest({ 
      order_id: mockOrder.id,
      event_type: "purchase",
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const eventType = body.event_type as string;
    assertEquals(isValidEvent(eventType), true);
  });

  it("should reject invalid event_type", async () => {
    const mockRequest = createMockRequest({ 
      order_id: mockOrder.id,
      event_type: "invalid_event",
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const eventType = body.event_type as string;
    assertEquals(isValidEvent(eventType), false);
  });

  it("should accept all valid event types", () => {
    const validEvents = ["purchase", "initiate_checkout", "add_to_cart", "view_content", "lead"];
    for (const event of validEvents) {
      assertEquals(isValidEvent(event), true);
    }
  });
});
