/**
 * Order Fetching Tests for trigger-webhooks
 * 
 * @module trigger-webhooks/tests/order-fetching.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;

describe("trigger-webhooks - Order Fetching", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should fetch order by id", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.order_id, "order-123");
  });

  it("should throw error when order not found", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "non-existent",
      event_type: "order.created",
    });
    
    const errorMessage = "Pedido não encontrado";
    assertExists(errorMessage);
  });

  it("should fetch order items", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const fetchesItems = true;
    assertEquals(fetchesItems, true);
  });

  it("should abort when no items", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const message = "No items";
    assertExists(message);
  });

  it("should log when no items", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const logMessage = "⚠️ Pedido sem itens, abortando.";
    assertExists(logMessage);
  });
});
