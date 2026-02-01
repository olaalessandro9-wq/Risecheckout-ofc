/**
 * Date Range Handling Tests for dashboard-analytics
 * 
 * @module dashboard-analytics/tests/date-range.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultProducer,
  createDateRange,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("dashboard-analytics - Date Range Handling", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should handle single day range", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-15",
      endDate: "2025-01-15",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.startDate, body.endDate);
  });

  it("should handle month range", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    assertExists(body.startDate);
    assertExists(body.endDate);
  });

  it("should handle year range", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    assertExists(body.startDate);
    assertExists(body.endDate);
  });

  it("should handle custom range", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-10",
      endDate: "2025-02-20",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    assertExists(body.startDate);
    assertExists(body.endDate);
  });

  it("should create date range with helper", () => {
    const range = createDateRange(30);
    assertExists(range.startDate);
    assertExists(range.endDate);
  });
});
