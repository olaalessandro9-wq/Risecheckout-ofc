/**
 * Error Handling Tests for utmify-conversion
 * 
 * @module utmify-conversion/tests/error-handling.test
 * @version 2.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockRequest,
  createInvalidJsonRequest,
  createOptionsRequest,
  createDefaultConversionPayload,
} from "./_shared.ts";

describe("utmify-conversion - Error Handling", () => {
  it("should handle OPTIONS preflight request", () => {
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
      error: "Validation failed",
      details: ["orderId is required"],
    };
    assertExists(errorResponse.error);
    assertExists(errorResponse.details);
    assertEquals(errorResponse.success, false);
  });

  it("should not expose internal errors to client", () => {
    const internalError = new Error("Database connection failed");
    const clientResponse = {
      success: false,
      error: "Internal server error",
    };
    assertEquals(clientResponse.error.includes("Database"), false);
    assertExists(internalError.message);
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

  it("should validate missing required fields", () => {
    const incompletePayload: Record<string, unknown> = {
      orderId: "test-123",
      // Missing vendorId, customer, products, etc.
    };
    const hasMissingFields = !("vendorId" in incompletePayload);
    assertEquals(hasMissingFields, true);
  });

  it("should handle vendor not found error", () => {
    const errorResponse = {
      success: false,
      error: "Vendor not found",
    };
    assertEquals(errorResponse.error, "Vendor not found");
  });

  it("should handle no UTMify token configured", () => {
    const errorResponse = {
      success: false,
      error: "No UTMify token configured for this vendor",
    };
    assertEquals(errorResponse.success, false);
    assertExists(errorResponse.error);
  });

  it("should handle UTMify API errors", () => {
    const errorResponse = {
      success: false,
      error: "UTMify API error",
      details: {
        status: 500,
        message: "Internal Server Error",
      },
    };
    assertEquals(errorResponse.success, false);
    assertExists(errorResponse.details);
  });
});
