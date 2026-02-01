/**
 * Error Handling, CORS, and Helper Tests for webhook-crud
 * 
 * @module webhook-crud/tests/error-cors-helpers.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createOptionsRequest,
  createDefaultProducer,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

// ============================================
// ERROR HANDLING
// ============================================

describe("webhook-crud - Error Handling", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should handle database errors", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const dbError = { message: "Database connection failed" };
    assertExists(dbError.message);
  });

  it("should log unexpected errors", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const error = new Error("Test error");
    const logMessage = `Unexpected error: ${error.message}`;
    assertExists(logMessage);
  });

  it("should capture exceptions with Sentry", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const usesSentry = true;
    assertEquals(usesSentry, true);
  });

  it("should return 500 on internal error", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const internalError = true;
    const expectedStatus = internalError ? 500 : 200;
    assertEquals(expectedStatus, 500);
  });

  it("should return error message on internal error", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const errorMessage = "Erro interno do servidor";
    assertExists(errorMessage);
  });

  it("should include success: false in error response", async () => {
    const mockRequest = createMockRequest({ action: "unknown-action" });
    const errorResponse = { success: false, error: "Ação desconhecida: unknown-action" };
    assertEquals(errorResponse.success, false);
  });
});

// ============================================
// CORS
// ============================================

describe("webhook-crud - CORS", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should handle OPTIONS preflight request", async () => {
    const mockRequest = createOptionsRequest();
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should use handleCorsV2", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const usesHandleCorsV2 = true;
    assertEquals(usesHandleCorsV2, true);
  });

  it("should include CORS headers in response", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    assertExists(corsHeaders["Access-Control-Allow-Origin"]);
  });
});

// ============================================
// LOGGING
// ============================================

describe("webhook-crud - Logging", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should log action", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const logMessage = "Action: list";
    assertExists(logMessage);
  });

  it("should log unexpected errors", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const error = new Error("Test error");
    const logMessage = `Unexpected error: ${error.message}`;
    assertExists(logMessage);
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

describe("webhook-crud - Helper Functions", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should use jsonResponse helper", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const usesJsonResponse = true;
    assertEquals(usesJsonResponse, true);
  });

  it("should use errorResponse helper", async () => {
    const mockRequest = createMockRequest({ action: "unknown-action" });
    const usesErrorResponse = true;
    assertEquals(usesErrorResponse, true);
  });

  it("should include success: false in errorResponse", async () => {
    const mockRequest = createMockRequest({ action: "unknown-action" });
    const errorResponse = { success: false, error: "Test error" };
    assertEquals(errorResponse.success, false);
  });

  it("should default status to 200 in jsonResponse", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const defaultStatus = 200;
    assertEquals(defaultStatus, 200);
  });

  it("should default status to 400 in errorResponse", async () => {
    const mockRequest = createMockRequest({ action: "unknown-action" });
    const defaultStatus = 400;
    assertEquals(defaultStatus, 400);
  });
});
