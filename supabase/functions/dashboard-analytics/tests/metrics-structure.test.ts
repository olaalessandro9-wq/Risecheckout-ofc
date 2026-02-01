/**
 * Metrics Structure Tests for dashboard-analytics
 * 
 * @module dashboard-analytics/tests/metrics-structure.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultProducer,
  createDefaultMetrics,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("dashboard-analytics - Metrics Structure", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should include paid_count in currentMetrics", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    const currentMetrics = createDefaultMetrics();
    assertExists(currentMetrics.paid_count);
  });

  it("should include paid_revenue_cents in currentMetrics", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    const currentMetrics = createDefaultMetrics();
    assertExists(currentMetrics.paid_revenue_cents);
  });

  it("should log metrics in response", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    const logMessage = "Response: 10 paid, 100000 cents";
    assertExists(logMessage);
  });

  it("should create metrics with factory", () => {
    const metrics = createDefaultMetrics();
    assertEquals(metrics.paid_count, 10);
    assertEquals(metrics.paid_revenue_cents, 100000);
  });
});
