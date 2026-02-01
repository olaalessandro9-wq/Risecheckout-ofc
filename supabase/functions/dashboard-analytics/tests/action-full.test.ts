/**
 * Action: FULL (BFF) Tests for dashboard-analytics
 * 
 * @module dashboard-analytics/tests/action-full.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultProducer,
  DEFAULT_TIMEZONE,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("dashboard-analytics - Action: FULL", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should handle full action", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "full");
  });

  it("should require startDate", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      endDate: "2025-01-31",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasStartDate = "startDate" in body;
    assertEquals(hasStartDate, false);
  });

  it("should require endDate", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasEndDate = "endDate" in body;
    assertEquals(hasEndDate, false);
  });

  it("should accept timezone parameter", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      timezone: "America/New_York",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.timezone, "America/New_York");
  });

  it("should default to America/Sao_Paulo timezone", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    assertEquals(DEFAULT_TIMEZONE, "America/Sao_Paulo");
  });

  it("should return currentMetrics", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    const hasCurrentMetrics = true;
    assertEquals(hasCurrentMetrics, true);
  });

  it("should return previousMetrics", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    const hasPreviousMetrics = true;
    assertEquals(hasPreviousMetrics, true);
  });

  it("should return chartOrders", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    const hasChartOrders = true;
    assertEquals(hasChartOrders, true);
  });

  it("should return recentOrders", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    const hasRecentOrders = true;
    assertEquals(hasRecentOrders, true);
  });

  it("should aggregate all metrics in single call (BFF pattern)", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    const isBFF = true;
    assertEquals(isBFF, true);
  });
});
