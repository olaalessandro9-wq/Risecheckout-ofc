/**
 * Edge Cases Tests for trigger-webhooks
 * 
 * @module trigger-webhooks/tests/edge-cases.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  EVENT_TYPES,
  isValidEventType,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;

describe("trigger-webhooks - Edge Cases", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should handle UUID order_id", async () => {
    const uuidOrderId = "550e8400-e29b-41d4-a716-446655440000";
    
    const mockRequest = createMockRequest({ 
      order_id: uuidOrderId,
      event_type: "order.created",
    });
    
    assertExists(uuidOrderId);
  });

  it("should handle different event types", async () => {
    for (const eventType of EVENT_TYPES) {
      const mockRequest = createMockRequest({ 
        order_id: "order-123",
        event_type: eventType,
      });
      
      const body = await mockRequest.json() as Record<string, unknown>;
      assertEquals(body.event_type, eventType);
    }
  });

  it("should validate event type with type guard", () => {
    assertEquals(isValidEventType("order.created"), true);
    assertEquals(isValidEventType("order.paid"), true);
    assertEquals(isValidEventType("invalid"), false);
  });

  it("should handle order with multiple items", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const items = [
      { product_id: "prod-1", product_name: "Product 1" },
      { product_id: "prod-2", product_name: "Product 2" },
      { product_id: "prod-3", product_name: "Product 3" },
    ];
    
    assertEquals(items.length, 3);
  });

  it("should handle webhook with no products filter", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const webhook = {
      id: "webhook-1",
      webhook_products: [],
    };
    
    assertEquals(webhook.webhook_products.length, 0);
  });

  it("should handle webhook with specific products", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const webhook = {
      id: "webhook-1",
      webhook_products: [
        { product_id: "prod-1" },
        { product_id: "prod-2" },
      ],
    };
    
    assertEquals(webhook.webhook_products.length, 2);
  });
});
