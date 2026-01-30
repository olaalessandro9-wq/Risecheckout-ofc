/**
 * useProductPixels - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests product pixel linking and management.
 * 
 * @module hooks/__tests__/useProductPixels.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useProductPixels } from "../useProductPixels";
import type { ProductPixelLinkData } from "@/modules/pixels";

// Default link data factory
const createLinkData = (overrides: Partial<ProductPixelLinkData> = {}): ProductPixelLinkData => ({
  pixel_id: "pixel-1",
  fire_on_initiate_checkout: false,
  fire_on_purchase: false,
  fire_on_pix: false,
  fire_on_card: false,
  fire_on_boleto: false,
  custom_value_percent: 100,
  ...overrides,
});
const mockApiCall = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    call: (...args: unknown[]) => mockApiCall(...args),
  },
}));

const mockVendorPixels = [
  {
    id: "pixel-1",
    vendor_id: "vendor-1",
    name: "Meta Pixel",
    platform: "meta",
    pixel_id: "123456",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

const mockLinkedPixels = [
  {
    id: "pixel-2",
    vendor_id: "vendor-1",
    name: "Google Ads",
    platform: "google_ads",
    pixel_id: "789012",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    link: {
      id: "link-1",
      product_id: "prod-1",
      pixel_id: "pixel-2",
      fire_on_initiate_checkout: true,
      fire_on_purchase: true,
    },
  },
];

describe("useProductPixels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial fetch", () => {
    it("should fetch vendor and linked pixels on mount", async () => {
      mockApiCall.mockResolvedValueOnce({
        data: {
          success: true,
          vendorPixels: mockVendorPixels,
          linkedPixels: mockLinkedPixels,
        },
        error: null,
      });

      const { result } = renderHook(() => useProductPixels("prod-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiCall).toHaveBeenCalledWith("pixel-management", {
        action: "list-product-links",
        productId: "prod-1",
      });

      expect(result.current.vendorPixels).toHaveLength(1);
      expect(result.current.linkedPixels).toHaveLength(1);
    });

    it("should not fetch when productId is empty", async () => {
      const { result } = renderHook(() => useProductPixels(""));

      // Wait a tick to ensure useEffect ran
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockApiCall).not.toHaveBeenCalled();
      expect(result.current.vendorPixels).toEqual([]);
    });

    it("should handle API error", async () => {
      mockApiCall.mockResolvedValueOnce({
        data: null,
        error: new Error("Network error"),
      });

      const { result } = renderHook(() => useProductPixels("prod-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.vendorPixels).toEqual([]);
      expect(result.current.linkedPixels).toEqual([]);
    });

    it("should handle API response error", async () => {
      mockApiCall.mockResolvedValueOnce({
        data: { success: false, error: "Not found" },
        error: null,
      });

      const { result } = renderHook(() => useProductPixels("prod-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.vendorPixels).toEqual([]);
    });
  });

  describe("linkPixel", () => {
    it("should link pixel successfully", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { success: true, vendorPixels: [], linkedPixels: [] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { success: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { success: true, vendorPixels: [], linkedPixels: mockLinkedPixels },
          error: null,
        });

      const { result } = renderHook(() => useProductPixels("prod-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.linkPixel(
          createLinkData({
            pixel_id: "pixel-1",
            fire_on_initiate_checkout: true,
            fire_on_purchase: true,
          })
        );
      });

      expect(success!).toBe(true);
      expect(mockApiCall).toHaveBeenCalledWith(
        "pixel-management",
        expect.objectContaining({
          action: "link-to-product",
          productId: "prod-1",
          pixelId: "pixel-1",
        })
      );
    });

    it("should return false on link error", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { success: true, vendorPixels: [], linkedPixels: [] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: new Error("Link failed"),
        });

      const { result } = renderHook(() => useProductPixels("prod-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.linkPixel(
          createLinkData({
            pixel_id: "pixel-1",
            fire_on_initiate_checkout: true,
            fire_on_purchase: true,
          })
        );
      });

      expect(success!).toBe(false);
    });
  });

  describe("unlinkPixel", () => {
    it("should unlink pixel successfully", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { success: true, vendorPixels: [], linkedPixels: mockLinkedPixels },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { success: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { success: true, vendorPixels: [], linkedPixels: [] },
          error: null,
        });

      const { result } = renderHook(() => useProductPixels("prod-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.unlinkPixel("pixel-2");
      });

      expect(success!).toBe(true);
      expect(mockApiCall).toHaveBeenCalledWith("pixel-management", {
        action: "unlink-from-product",
        productId: "prod-1",
        pixelId: "pixel-2",
      });
    });

    it("should return false on unlink error", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { success: true, vendorPixels: [], linkedPixels: mockLinkedPixels },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { success: false, error: "Cannot unlink" },
          error: null,
        });

      const { result } = renderHook(() => useProductPixels("prod-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.unlinkPixel("pixel-2");
      });

      expect(success!).toBe(false);
    });
  });

  describe("updateLink", () => {
    it("should update link successfully", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { success: true, vendorPixels: [], linkedPixels: mockLinkedPixels },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { success: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { success: true, vendorPixels: [], linkedPixels: mockLinkedPixels },
          error: null,
        });

      const { result } = renderHook(() => useProductPixels("prod-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.updateLink("pixel-2", {
          fire_on_pix: true,
        });
      });

      expect(success!).toBe(true);
      expect(mockApiCall).toHaveBeenCalledWith(
        "pixel-management",
        expect.objectContaining({
          action: "update-product-link",
          productId: "prod-1",
          pixelId: "pixel-2",
        })
      );
    });
  });

  describe("refetch", () => {
    it("should refetch data", async () => {
      mockApiCall.mockResolvedValue({
        data: { success: true, vendorPixels: [], linkedPixels: [] },
        error: null,
      });

      const { result } = renderHook(() => useProductPixels("prod-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });
  });

  describe("saving states", () => {
    it("should set isSaving during link operation", async () => {
      let resolveFn: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolveFn = resolve;
      });

      mockApiCall
        .mockResolvedValueOnce({
          data: { success: true, vendorPixels: [], linkedPixels: [] },
          error: null,
        })
        .mockReturnValueOnce(promise);

      const { result } = renderHook(() => useProductPixels("prod-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let linkPromise: Promise<boolean>;
      act(() => {
        linkPromise = result.current.linkPixel(
          createLinkData({ fire_on_purchase: true })
        );
      });

      expect(result.current.isSaving).toBe(true);

      await act(async () => {
        resolveFn!({ data: { success: true }, error: null });
        await linkPromise;
      });
    });
  });
});
