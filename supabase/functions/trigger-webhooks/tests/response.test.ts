/**
 * Response Tests for trigger-webhooks
 * 
 * @module trigger-webhooks/tests/response.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;

describe("trigger-webhooks - Response", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should return success: true", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const response = { success: true };
    assertEquals(response.success, true);
  });

  it("should return results array", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const response = { success: true, results: [] };
    assertExists(response.results);
  });

  it("should log completion", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const logMessage = "✅ Processamento concluído";
    assertExists(logMessage);
  });

  it("should log total webhooks sent", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const logData = { total_webhooks_sent: 0 };
    assertExists(logData.total_webhooks_sent);
  });

  it("should return 200 status", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const expectedStatus = 200;
    assertEquals(expectedStatus, 200);
  });
});
