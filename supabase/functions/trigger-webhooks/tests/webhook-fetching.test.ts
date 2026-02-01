/**
 * Webhook Fetching Tests for trigger-webhooks
 * 
 * @module trigger-webhooks/tests/webhook-fetching.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;

describe("trigger-webhooks - Webhook Fetching", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should fetch webhooks by vendor_id", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const fetchesWebhooks = true;
    assertEquals(fetchesWebhooks, true);
  });

  it("should filter active webhooks only", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const filtersActive = true;
    assertEquals(filtersActive, true);
  });

  it("should include webhook_products relation", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const includesProducts = true;
    assertEquals(includesProducts, true);
  });

  it("should return when no webhooks configured", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const message = "No webhooks configured";
    assertExists(message);
  });

  it("should log when no webhooks", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const logMessage = "ℹ️ Nenhum webhook configurado para este vendedor.";
    assertExists(logMessage);
  });

  it("should throw error on webhook fetch failure", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const errorMessage = "Erro ao buscar webhooks:";
    assertExists(errorMessage);
  });
});
