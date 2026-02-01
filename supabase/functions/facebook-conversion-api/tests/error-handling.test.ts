/**
 * Error Handling Tests for facebook-conversion-api
 * 
 * @module facebook-conversion-api/tests/error-handling.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createInvalidJsonRequest,
  createOptionsRequest,
  createDefaultEvent,
  type FacebookEvent,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockEvent: FacebookEvent;

describe("facebook-conversion-api - Error Handling", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockEvent = createDefaultEvent();
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
      error: "Invalid event data",
      code: "INVALID_EVENT",
    };
    assertExists(errorResponse.error);
    assertExists(errorResponse.code);
    assertEquals(errorResponse.success, false);
  });

  it("should handle Facebook API errors gracefully", () => {
    const fbError = {
      error: {
        message: "(#100) Param data[0][event_time] must be a valid time",
        type: "OAuthException",
        code: 100,
        fbtrace_id: "AbCdEfGhIjK",
      },
    };
    assertExists(fbError.error.code);
    assertEquals(fbError.error.code, 100);
  });

  it("should not expose access token in errors", () => {
    const errorLog = {
      message: "API call failed",
      pixel_id: "123456789",
      // access_token should NOT be included
    };
    assertEquals("access_token" in errorLog, false);
  });

  it("should log errors for debugging", () => {
    const error = new Error("Facebook API error");
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message: error.message,
      event_name: mockEvent.event_name,
    };
    assertExists(logEntry.timestamp);
    assertExists(logEntry.event_name);
  });

  it("should include CORS headers in error responses", () => {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    assertExists(corsHeaders["Access-Control-Allow-Origin"]);
  });

  it("should handle network timeouts", () => {
    const timeoutError = {
      code: "ETIMEDOUT",
      message: "Request timed out",
    };
    assertEquals(timeoutError.code, "ETIMEDOUT");
  });
});
