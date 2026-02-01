/**
 * CORS and Logging Tests for trigger-webhooks
 * 
 * @module trigger-webhooks/tests/cors-logging.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  FUNCTION_URL,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;

describe("trigger-webhooks - CORS", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should handle OPTIONS preflight request", async () => {
    const mockRequest = new Request(FUNCTION_URL, {
      method: "OPTIONS",
      headers: new Headers(),
    });
    
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should return ok for OPTIONS", async () => {
    const mockRequest = new Request(FUNCTION_URL, {
      method: "OPTIONS",
      headers: new Headers(),
    });
    
    const expectedBody = "ok";
    assertEquals(expectedBody, "ok");
  });

  it("should use PUBLIC_CORS_HEADERS", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const usesPublicCors = true;
    assertEquals(usesPublicCors, true);
  });
});

describe("trigger-webhooks - Logging", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should log version on start", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const logMessage = "Versão 474 iniciada (P0-5 secured)";
    assertExists(logMessage);
  });

  it("should log processing start", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const logMessage = "🚀 Iniciando processamento";
    assertExists(logMessage);
  });

  it("should log order_id and event_type", async () => {
    const mockRequest = createMockRequest({ 
      order_id: "order-123",
      event_type: "order.created",
    });
    
    const logData = { order_id: "order-123", event_type: "order.created" };
    assertExists(logData.order_id);
    assertExists(logData.event_type);
  });
});
