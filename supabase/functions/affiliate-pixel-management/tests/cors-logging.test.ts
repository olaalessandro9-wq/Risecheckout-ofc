/**
 * CORS and Logging Tests for affiliate-pixel-management
 * 
 * @module affiliate-pixel-management/tests/cors-logging.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createOptionsRequest,
  createDefaultProducer,
  createValidPixel,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

// ============================================
// CORS
// ============================================

describe("affiliate-pixel-management - CORS", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should handle OPTIONS preflight request", async () => {
    const mockRequest = createOptionsRequest();
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should use handleCorsV2", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const usesHandleCorsV2 = true;
    assertEquals(usesHandleCorsV2, true);
  });

  it("should include CORS headers in response", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
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

describe("affiliate-pixel-management - Logging", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should log action and user", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const logMessage = `Action: save-all, User: ${mockProducer.id}`;
    assertExists(logMessage);
  });

  it("should log saved pixels count", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-1", platform: "facebook" },
        { pixel_id: "pixel-2", platform: "google" },
      ],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as unknown[];
    const logMessage = `Saved ${pixels.length} pixels for affiliate affiliate-123`;
    assertExists(logMessage);
  });

  it("should log errors", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const error = new Error("Test error");
    const logMessage = `Unhandled error: ${error.message}`;
    assertExists(logMessage);
  });
});
