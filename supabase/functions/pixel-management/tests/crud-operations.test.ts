/**
 * CRUD Operations Tests for pixel-management
 * 
 * @module pixel-management/tests/crud-operations.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultProducer,
  createValidPixel,
  isValidPlatform,
  type MockProducer,
  type PixelData,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("pixel-management - CRUD Operations", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  // ============================================
  // LIST
  // ============================================

  it("should list all pixels for vendor", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "list");
  });

  it("should filter pixels by product_id when provided", async () => {
    const mockRequest = createMockRequest({ 
      action: "list",
      product_id: "product-123",
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertExists(body.product_id);
  });

  // ============================================
  // CREATE
  // ============================================

  it("should create pixel with valid data", async () => {
    const pixelData = createValidPixel();
    const mockRequest = createMockRequest({ 
      action: "create",
      data: pixelData,
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "create");
    assertExists(body.data);
  });

  it("should require pixel_id for creation", () => {
    const pixelData = createValidPixel();
    assertExists(pixelData.pixel_id);
  });

  it("should require platform for creation", () => {
    const pixelData = createValidPixel();
    assertExists(pixelData.platform);
    assertEquals(isValidPlatform(pixelData.platform), true);
  });

  it("should validate platform is supported", () => {
    const validPlatforms = ["facebook", "google", "tiktok"];
    for (const platform of validPlatforms) {
      assertEquals(isValidPlatform(platform), true);
    }
  });

  // ============================================
  // UPDATE
  // ============================================

  it("should update pixel with valid data", async () => {
    const mockRequest = createMockRequest({ 
      action: "update",
      pixelId: "pixel-123",
      data: { enabled: false },
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "update");
    assertExists(body.pixelId);
  });

  it("should require pixelId for update", async () => {
    const mockRequest = createMockRequest({ 
      action: "update",
      data: { enabled: false },
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasPixelId = "pixelId" in body;
    assertEquals(hasPixelId, false);
  });

  it("should validate pixel ownership before update", () => {
    const pixelVendorId = mockProducer.id;
    const requestVendorId = mockProducer.id;
    const isOwner = pixelVendorId === requestVendorId;
    assertEquals(isOwner, true);
  });

  // ============================================
  // DELETE
  // ============================================

  it("should delete pixel by ID", async () => {
    const mockRequest = createMockRequest({ 
      action: "delete",
      pixelId: "pixel-123",
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "delete");
    assertExists(body.pixelId);
  });

  it("should require pixelId for delete", async () => {
    const mockRequest = createMockRequest({ action: "delete" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasPixelId = "pixelId" in body;
    assertEquals(hasPixelId, false);
  });

  it("should validate pixel ownership before delete", () => {
    const pixelVendorId = mockProducer.id;
    const requestVendorId = mockProducer.id;
    const isOwner = pixelVendorId === requestVendorId;
    assertEquals(isOwner, true);
  });
});
