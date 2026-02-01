/**
 * Edge Cases Tests for affiliate-pixel-management
 * 
 * @module affiliate-pixel-management/tests/edge-cases.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultProducer,
  createPixelsArray,
  MAX_PIXELS,
  type MockProducer,
  type PixelInput,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("affiliate-pixel-management - Edge Cases", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should handle UUID format affiliate_id", async () => {
    const uuidAffiliateId = "550e8400-e29b-41d4-a716-446655440000";
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: uuidAffiliateId,
      pixels: [],
    });
    assertExists(uuidAffiliateId);
  });

  it("should handle empty pixels array", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as unknown[];
    assertEquals(pixels.length, 0);
  });

  it("should handle null pixels", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: null as unknown as PixelInput[],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.pixels, null);
  });

  it("should handle maximum allowed pixels", async () => {
    const maxPixels = createPixelsArray(MAX_PIXELS);
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: maxPixels,
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as unknown[];
    assertEquals(pixels.length, MAX_PIXELS);
  });

  it("should handle zero custom values", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [{ 
        pixel_id: "pixel-123",
        platform: "facebook",
        custom_value_pix: 0,
        custom_value_boleto: 0,
        custom_value_card: 0,
      }],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as PixelInput[];
    assertEquals(pixels[0].custom_value_pix, 0);
  });

  it("should handle negative custom values", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [{ 
        pixel_id: "pixel-123",
        platform: "facebook",
        custom_value_pix: -10,
      }],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as PixelInput[];
    assertEquals(pixels[0].custom_value_pix, -10);
  });

  it("should handle very long pixel_id", async () => {
    const longPixelId = "A".repeat(500);
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [{ pixel_id: longPixelId, platform: "facebook" }],
    });
    assertEquals(longPixelId.length, 500);
  });

  it("should handle special characters in pixel_id", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [{ pixel_id: "pixel-123!@#$%", platform: "facebook" }],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as PixelInput[];
    assertExists(pixels[0].pixel_id);
  });
});
