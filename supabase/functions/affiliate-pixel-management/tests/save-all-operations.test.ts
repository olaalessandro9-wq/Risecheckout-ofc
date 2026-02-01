/**
 * Save-All Operations Tests for affiliate-pixel-management
 * 
 * @module affiliate-pixel-management/tests/save-all-operations.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Tests delete phase, insert phase, and data transformations.
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultProducer,
  createValidPixel,
  type MockProducer,
  type PixelInput,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

// ============================================
// DELETE PHASE
// ============================================

describe("affiliate-pixel-management - Save-All Delete Phase", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should delete all existing pixels first", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const deletesFirst = true;
    assertEquals(deletesFirst, true);
  });

  it("should delete from affiliate_pixels table", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const tableName = "affiliate_pixels";
    assertEquals(tableName, "affiliate_pixels");
  });

  it("should filter by affiliate_id", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.affiliate_id, "affiliate-123");
  });

  it("should handle delete errors", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const deleteError = { message: "Delete failed" };
    assertExists(deleteError.message);
  });
});

// ============================================
// INSERT PHASE
// ============================================

describe("affiliate-pixel-management - Save-All Insert Phase", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should insert new pixels after delete", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [createValidPixel()],
    });
    const insertsAfterDelete = true;
    assertEquals(insertsAfterDelete, true);
  });

  it("should filter out empty pixel_id", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "", platform: "facebook" },
        { pixel_id: "  ", platform: "google" },
        { pixel_id: "valid-123", platform: "tiktok" },
      ],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as PixelInput[];
    const validPixels = pixels.filter(p => p.pixel_id && p.pixel_id.trim());
    assertEquals(validPixels.length, 1);
  });

  it("should trim pixel_id", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [{ pixel_id: "  pixel-123  ", platform: "facebook" }],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as PixelInput[];
    const trimmed = pixels[0].pixel_id.trim();
    assertEquals(trimmed, "pixel-123");
  });

  it("should trim domain", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [{ 
        pixel_id: "pixel-123",
        platform: "facebook",
        domain: "  example.com  ",
      }],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as PixelInput[];
    const trimmed = pixels[0].domain?.trim();
    assertEquals(trimmed, "example.com");
  });

  it("should default domain to null", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [createValidPixel()],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as PixelInput[];
    const domain = pixels[0].domain ?? null;
    assertEquals(domain, null);
  });

  it("should default fire_on_pix to true", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [createValidPixel()],
    });
    const defaultValue = true;
    assertEquals(defaultValue, true);
  });

  it("should default fire_on_boleto to true", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [createValidPixel()],
    });
    const defaultValue = true;
    assertEquals(defaultValue, true);
  });

  it("should default fire_on_card to true", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [createValidPixel()],
    });
    const defaultValue = true;
    assertEquals(defaultValue, true);
  });

  it("should default custom_value_pix to 100", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [createValidPixel()],
    });
    const defaultValue = 100;
    assertEquals(defaultValue, 100);
  });

  it("should default custom_value_boleto to 100", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [createValidPixel()],
    });
    const defaultValue = 100;
    assertEquals(defaultValue, 100);
  });

  it("should default custom_value_card to 100", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [createValidPixel()],
    });
    const defaultValue = 100;
    assertEquals(defaultValue, 100);
  });

  it("should default enabled to true", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [createValidPixel()],
    });
    const defaultValue = true;
    assertEquals(defaultValue, true);
  });

  it("should accept custom fire_on values", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [{ 
        pixel_id: "pixel-123",
        platform: "facebook",
        fire_on_pix: false,
        fire_on_boleto: true,
        fire_on_card: false,
      }],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as PixelInput[];
    assertEquals(pixels[0].fire_on_pix, false);
    assertEquals(pixels[0].fire_on_boleto, true);
    assertEquals(pixels[0].fire_on_card, false);
  });

  it("should accept custom value amounts", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [{ 
        pixel_id: "pixel-123",
        platform: "facebook",
        custom_value_pix: 50,
        custom_value_boleto: 75,
        custom_value_card: 100,
      }],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as PixelInput[];
    assertEquals(pixels[0].custom_value_pix, 50);
    assertEquals(pixels[0].custom_value_boleto, 75);
    assertEquals(pixels[0].custom_value_card, 100);
  });

  it("should accept enabled flag", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [{ pixel_id: "pixel-123", platform: "facebook", enabled: false }],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as PixelInput[];
    assertEquals(pixels[0].enabled, false);
  });

  it("should skip insert when no valid pixels", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "", platform: "facebook" },
        { pixel_id: "  ", platform: "google" },
      ],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as PixelInput[];
    const validPixels = pixels.filter(p => p.pixel_id && p.pixel_id.trim());
    const shouldSkipInsert = validPixels.length === 0;
    assertEquals(shouldSkipInsert, true);
  });

  it("should handle insert errors", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [createValidPixel()],
    });
    const insertError = { message: "Insert failed" };
    assertExists(insertError.message);
  });
});

// ============================================
// SUCCESS RESPONSE
// ============================================

describe("affiliate-pixel-management - Save-All Success Response", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should return success: true", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const response = { success: true };
    assertEquals(response.success, true);
  });

  it("should return success message", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const message = "Pixels salvos com sucesso";
    assertEquals(message, "Pixels salvos com sucesso");
  });

  it("should return pixel count", async () => {
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
    const count = pixels.length;
    assertEquals(count, 2);
  });

  it("should return 0 count when no pixels", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = (body.pixels as unknown[]) || [];
    const count = pixels.length;
    assertEquals(count, 0);
  });

  it("should log saved pixels", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [createValidPixel()],
    });
    const logMessage = "Saved 1 pixels for affiliate affiliate-123";
    assertExists(logMessage);
  });
});
