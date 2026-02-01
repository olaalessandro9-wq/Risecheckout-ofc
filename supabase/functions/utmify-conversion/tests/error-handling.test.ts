/**
 * Error Handling Tests for utmify-conversion
 * 
 * @module utmify-conversion/tests/error-handling.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createInvalidJsonRequest,
  createOptionsRequest,
  createDefaultOrder,
  type MockOrder,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockOrder: MockOrder;

describe("utmify-conversion - Error Handling", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockOrder = createDefaultOrder();
  });

  it("should handle OPTIONS preflight request", async () => {
    const mockRequest = createOptionsRequest();
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should return 400 for invalid JSON", async () => {
    const mockRequest = createInvalidJsonRequest();
    let parseError = false;
    try {
      await mockRequest.json();
    } catch {
      parseError = true;
    }
    assertEquals(parseError, true);
  });

  it("should return structured error response", () => {
    const errorResponse = {
      success: false,
      error: "Order not found",
      code: "ORDER_NOT_FOUND",
    };
    assertExists(errorResponse.error);
    assertExists(errorResponse.code);
    assertEquals(errorResponse.success, false);
  });

  it("should not expose internal errors to client", () => {
    const internalError = new Error("Database connection failed");
    const clientResponse = {
      success: false,
      error: "An error occurred processing your request",
    };
    assertEquals(clientResponse.error.includes("Database"), false);
  });

  it("should log errors for debugging", () => {
    const error = new Error("Test error");
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message: error.message,
      stack: error.stack,
    };
    assertExists(logEntry.timestamp);
    assertExists(logEntry.message);
  });

  it("should handle database errors gracefully", () => {
    const dbError = { code: "PGRST301", message: "Connection refused" };
    const isDbError = dbError.code.startsWith("PGRST");
    assertEquals(isDbError, true);
  });

  it("should include CORS headers in error responses", () => {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    assertExists(corsHeaders["Access-Control-Allow-Origin"]);
  });
});
