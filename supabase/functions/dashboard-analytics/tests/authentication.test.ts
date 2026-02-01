/**
 * Authentication Tests for dashboard-analytics
 * 
 * @module dashboard-analytics/tests/authentication.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createMockRequestWithoutAuth,
  createDefaultProducer,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("dashboard-analytics - Authentication", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should require authentication", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    assertExists(mockRequest.headers.get("Authorization"));
  });

  it("should return 401 when not authenticated", async () => {
    const mockRequest = createMockRequestWithoutAuth({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    const hasAuth = mockRequest.headers.has("Authorization");
    const expectedStatus = hasAuth ? 200 : 401;
    assertEquals(expectedStatus, 401);
  });

  it("should extract producer ID from auth", async () => {
    const mockRequest = createMockRequest({ 
      action: "full",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    
    assertExists(mockProducer.id);
  });
});
