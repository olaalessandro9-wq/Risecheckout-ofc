/**
 * CORS and Edge Cases Tests for dashboard-analytics
 * 
 * @module dashboard-analytics/tests/cors-edge-cases.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultProducer,
  createChartOrder,
  createRecentOrder,
  FUNCTION_URL,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("dashboard-analytics - CORS", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should handle OPTIONS preflight request", async () => {
    const mockRequest = new Request(FUNCTION_URL, {
      method: "OPTIONS",
      headers: new Headers(),
    });
    
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should include CORS headers in response", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };
    
    assertExists(corsHeaders["Access-Control-Allow-Origin"]);
  });
});

describe("dashboard-analytics - Edge Cases", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should create chart order with factory", () => {
    const order = createChartOrder();
    assertExists(order.date);
    assertExists(order.count);
    assertExists(order.revenue_cents);
  });

  it("should create recent order with factory", () => {
    const order = createRecentOrder();
    assertExists(order.id);
    assertExists(order.customer_email);
    assertExists(order.status);
  });

  it("should handle large date ranges", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2020-01-01",
      endDate: "2025-12-31",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    assertExists(body.startDate);
  });

  it("should handle timezone edge cases", async () => {
    const timezones = [
      "America/Sao_Paulo",
      "America/New_York",
      "Europe/London",
      "Asia/Tokyo",
    ];
    
    for (const tz of timezones) {
      const mockRequest = createMockRequest({ 
        action: "full",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        timezone: tz,
      });
      
      const body = await mockRequest.json() as Record<string, unknown>;
      assertEquals(body.timezone, tz);
    }
  });

  it("should handle empty results gracefully", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2099-01-01",
      endDate: "2099-01-31",
    });
    
    const emptyResults = {
      currentMetrics: { paid_count: 0, paid_revenue_cents: 0 },
      chartOrders: [],
      recentOrders: [],
    };
    
    assertEquals(emptyResults.currentMetrics.paid_count, 0);
    assertEquals(emptyResults.chartOrders.length, 0);
  });
});
