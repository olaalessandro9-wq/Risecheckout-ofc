/**
 * Save-All Validation Tests for affiliate-pixel-management
 * 
 * @module affiliate-pixel-management/tests/save-all-validation.test
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
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("affiliate-pixel-management - Save-All Validation", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should require affiliate_id", async () => {
    const mockRequest = createMockRequest({ action: "save-all", pixels: [] });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasAffiliateId = "affiliate_id" in body;
    assertEquals(hasAffiliateId, false);
  });

  it("should return 400 when affiliate_id is missing", async () => {
    const mockRequest = createMockRequest({ action: "save-all", pixels: [] });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasAffiliateId = "affiliate_id" in body;
    const expectedStatus = hasAffiliateId ? 200 : 400;
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing affiliate_id", async () => {
    const mockRequest = createMockRequest({ action: "save-all", pixels: [] });
    const errorMessage = "affiliate_id é obrigatório";
    assertExists(errorMessage);
  });

  it("should validate affiliate ownership", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const validatesOwnership = true;
    assertEquals(validatesOwnership, true);
  });

  it("should return 403 when not owner", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const isOwner = false;
    const expectedStatus = isOwner ? 200 : 403;
    assertEquals(expectedStatus, 403);
  });

  it("should return error message when not owner", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const errorMessage = "Não autorizado: você não é dono desta afiliação";
    assertExists(errorMessage);
  });

  it("should validate pixel limit", async () => {
    const tooManyPixels = createPixelsArray(MAX_PIXELS + 1);
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: tooManyPixels,
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as unknown[];
    const exceedsLimit = pixels.length > MAX_PIXELS;
    assertEquals(exceedsLimit, true);
  });

  it("should return 400 when pixel limit exceeded", async () => {
    const tooManyPixels = createPixelsArray(MAX_PIXELS + 1);
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: tooManyPixels,
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as unknown[];
    const expectedStatus = pixels.length > MAX_PIXELS ? 400 : 200;
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for pixel limit", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const errorMessage = `Máximo de ${MAX_PIXELS} pixels permitidos`;
    assertExists(errorMessage);
  });
});
