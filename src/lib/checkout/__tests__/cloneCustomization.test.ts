/**
 * cloneCustomizationWithImages Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the cloneCustomizationWithImages function.
 * Uses 'unknown' type assertion for test data since the function
 * handles arbitrary JSON structures internally.
 * 
 * @module test/lib/checkout/cloneCustomization
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { cloneCustomizationWithImages } from "@/lib/checkout/cloneCustomization";
import { copyPublicObjectToNewPath } from "@/lib/supabase/storageHelpers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckoutCustomization } from "@/types/checkoutEditor";

// Mock storage helpers
vi.mock("@/lib/supabase/storageHelpers", () => ({
  copyPublicObjectToNewPath: vi.fn(),
}));

/**
 * Helper to create test customization data
 * Uses unknown→CheckoutCustomization to allow partial test data
 */
function createTestCustomization<T>(data: T): CheckoutCustomization {
  return data as unknown as CheckoutCustomization;
}

/**
 * Helper to cast result for assertions
 */
function castResult<T>(result: CheckoutCustomization | null | undefined): T {
  return result as unknown as T;
}

describe("cloneCustomizationWithImages", () => {
  const mockCopyPublicObject = vi.mocked(copyPublicObjectToNewPath);
  const mockSupabase = {} as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("null/undefined handling", () => {
    it("should return null when customization is null", async () => {
      const result = await cloneCustomizationWithImages(mockSupabase, null, "new-product");
      expect(result).toBeNull();
    });

    it("should return undefined when customization is undefined", async () => {
      const result = await cloneCustomizationWithImages(mockSupabase, undefined, "new-product");
      expect(result).toBeUndefined();
    });
  });

  describe("imageUrl cloning", () => {
    it("should clone imageUrl fields", async () => {
      mockCopyPublicObject.mockResolvedValue("https://new-url.com/image.jpg");

      const customization = createTestCustomization({
        header: {
          imageUrl: "https://old-url.com/header.jpg",
        },
      });

      const result = await cloneCustomizationWithImages(
        mockSupabase,
        customization,
        "new-product"
      );

      expect(mockCopyPublicObject).toHaveBeenCalledWith(
        mockSupabase,
        "https://old-url.com/header.jpg",
        "new-product",
        "image"
      );
      
      const typedResult = castResult<{ header: { imageUrl: string } }>(result);
      expect(typedResult.header.imageUrl).toBe("https://new-url.com/image.jpg");
    });

    it("should handle empty imageUrl", async () => {
      const customization = createTestCustomization({
        header: {
          imageUrl: "",
        },
      });

      const result = await cloneCustomizationWithImages(
        mockSupabase,
        customization,
        "new-product"
      );

      expect(mockCopyPublicObject).not.toHaveBeenCalled();
      
      const typedResult = castResult<{ header: { imageUrl: string } }>(result);
      expect(typedResult.header.imageUrl).toBe("");
    });
  });

  describe("src cloning", () => {
    it("should clone src fields", async () => {
      mockCopyPublicObject.mockResolvedValue("https://new-url.com/asset.png");

      const customization = createTestCustomization({
        logo: {
          src: "https://old-url.com/logo.png",
        },
      });

      const result = await cloneCustomizationWithImages(
        mockSupabase,
        customization,
        "new-product"
      );

      expect(mockCopyPublicObject).toHaveBeenCalledWith(
        mockSupabase,
        "https://old-url.com/logo.png",
        "new-product",
        "asset"
      );
      
      const typedResult = castResult<{ logo: { src: string } }>(result);
      expect(typedResult.logo.src).toBe("https://new-url.com/asset.png");
    });
  });

  describe("nested structures", () => {
    it("should handle deeply nested objects", async () => {
      mockCopyPublicObject.mockResolvedValue("https://cloned.com/image.jpg");

      const customization = createTestCustomization({
        level1: {
          level2: {
            level3: {
              imageUrl: "https://original.com/deep.jpg",
            },
          },
        },
      });

      const result = await cloneCustomizationWithImages(
        mockSupabase,
        customization,
        "new-product"
      );

      expect(mockCopyPublicObject).toHaveBeenCalled();
      
      const typedResult = castResult<{ 
        level1: { level2: { level3: { imageUrl: string } } } 
      }>(result);
      expect(typedResult.level1.level2.level3.imageUrl).toBe("https://cloned.com/image.jpg");
    });

    it("should handle arrays with objects", async () => {
      mockCopyPublicObject
        .mockResolvedValueOnce("https://cloned.com/1.jpg")
        .mockResolvedValueOnce("https://cloned.com/2.jpg");

      const customization = createTestCustomization({
        slides: [
          { imageUrl: "https://original.com/1.jpg" },
          { imageUrl: "https://original.com/2.jpg" },
        ],
      });

      const result = await cloneCustomizationWithImages(
        mockSupabase,
        customization,
        "new-product"
      );

      expect(mockCopyPublicObject).toHaveBeenCalledTimes(2);
      
      const typedResult = castResult<{ slides: Array<{ imageUrl: string }> }>(result);
      expect(typedResult.slides[0].imageUrl).toBe("https://cloned.com/1.jpg");
      expect(typedResult.slides[1].imageUrl).toBe("https://cloned.com/2.jpg");
    });
  });

  describe("primitive values", () => {
    it("should preserve string values", async () => {
      const customization = createTestCustomization({
        title: "My Title",
        color: "#FF0000",
      });

      const result = await cloneCustomizationWithImages(
        mockSupabase,
        customization,
        "new-product"
      );

      const typedResult = castResult<{ title: string; color: string }>(result);
      expect(typedResult.title).toBe("My Title");
      expect(typedResult.color).toBe("#FF0000");
    });

    it("should preserve number values", async () => {
      const customization = createTestCustomization({
        fontSize: 16,
        opacity: 0.8,
      });

      const result = await cloneCustomizationWithImages(
        mockSupabase,
        customization,
        "new-product"
      );

      const typedResult = castResult<{ fontSize: number; opacity: number }>(result);
      expect(typedResult.fontSize).toBe(16);
      expect(typedResult.opacity).toBe(0.8);
    });

    it("should preserve boolean values", async () => {
      const customization = createTestCustomization({
        enabled: true,
        visible: false,
      });

      const result = await cloneCustomizationWithImages(
        mockSupabase,
        customization,
        "new-product"
      );

      const typedResult = castResult<{ enabled: boolean; visible: boolean }>(result);
      expect(typedResult.enabled).toBe(true);
      expect(typedResult.visible).toBe(false);
    });

    it("should preserve null values", async () => {
      const customization = createTestCustomization({
        optional: null,
      });

      const result = await cloneCustomizationWithImages(
        mockSupabase,
        customization,
        "new-product"
      );

      const typedResult = castResult<{ optional: null }>(result);
      expect(typedResult.optional).toBeNull();
    });
  });

  describe("product ID types", () => {
    it("should handle numeric product ID", async () => {
      mockCopyPublicObject.mockResolvedValue("https://cloned.com/image.jpg");

      const customization = createTestCustomization({
        image: { imageUrl: "https://original.com/image.jpg" },
      });

      await cloneCustomizationWithImages(
        mockSupabase,
        customization,
        12345
      );

      expect(mockCopyPublicObject).toHaveBeenCalledWith(
        mockSupabase,
        "https://original.com/image.jpg",
        12345,
        "image"
      );
    });

    it("should handle string product ID", async () => {
      mockCopyPublicObject.mockResolvedValue("https://cloned.com/image.jpg");

      const customization = createTestCustomization({
        image: { imageUrl: "https://original.com/image.jpg" },
      });

      await cloneCustomizationWithImages(
        mockSupabase,
        customization,
        "prod-uuid-123"
      );

      expect(mockCopyPublicObject).toHaveBeenCalledWith(
        mockSupabase,
        "https://original.com/image.jpg",
        "prod-uuid-123",
        "image"
      );
    });
  });
});
