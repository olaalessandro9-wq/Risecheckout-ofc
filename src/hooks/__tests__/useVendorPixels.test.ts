/**
 * useVendorPixels - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests vendor pixel CRUD operations.
 * 
 * @module hooks/__tests__/useVendorPixels.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useVendorPixels } from "../useVendorPixels";
import type { PixelFormData, PixelPlatform } from "@/modules/pixels";

// Default form data factory
const createPixelFormData = (overrides: Partial<PixelFormData> = {}): PixelFormData => ({
  platform: "facebook" as PixelPlatform,
  name: "Test Pixel",
  pixel_id: "123456789",
  access_token: undefined,
  conversion_label: undefined,
  domain: undefined,
  is_active: true,
  ...overrides,
});
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockApiCall = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    call: (...args: unknown[]) => mockApiCall(...args),
  },
}));

const mockPixels = [
  {
    id: "pixel-1",
    vendor_id: "vendor-1",
    name: "Facebook Pixel",
    platform: "facebook" as PixelPlatform,
    pixel_id: "123456789",
    access_token: "token-1",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: "pixel-2",
    vendor_id: "vendor-1",
    name: "Google Ads",
    platform: "google_ads" as PixelPlatform,
    pixel_id: "987654321",
    is_active: false,
    created_at: "2024-01-02",
    updated_at: "2024-01-02",
  },
];

describe("useVendorPixels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial fetch", () => {
    it("should fetch pixels on mount", async () => {
      mockApiCall.mockResolvedValueOnce({
        data: { pixels: mockPixels },
        error: null,
      });

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiCall).toHaveBeenCalledWith("pixel-management", {
        action: "list",
      });
      expect(result.current.pixels).toHaveLength(2);
    });

    it("should handle API error", async () => {
      mockApiCall.mockResolvedValueOnce({
        data: null,
        error: new Error("Network error"),
      });

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Erro ao carregar pixels");
      expect(result.current.pixels).toEqual([]);
    });

    it("should handle error in response data", async () => {
      mockApiCall.mockResolvedValueOnce({
        data: { error: "Server error" },
        error: null,
      });

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Erro ao carregar pixels");
    });
  });

  describe("createPixel", () => {
    it("should create pixel successfully", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { pixels: [] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {},
          error: null,
        })
        .mockResolvedValueOnce({
          data: { pixels: mockPixels },
          error: null,
        });

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.createPixel(
          createPixelFormData({
            name: "New Pixel",
            pixel_id: "111222333",
            access_token: "token",
          })
        );
      });

      expect(success!).toBe(true);
      expect(mockApiCall).toHaveBeenCalledWith(
        "pixel-management",
        expect.objectContaining({
          action: "create",
          data: expect.objectContaining({
            platform: "facebook",
            name: "New Pixel",
            pixel_id: "111222333",
          }),
        })
      );
    });

    it("should return false on create error", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { pixels: [] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: new Error("Create failed"),
        });

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.createPixel(
          createPixelFormData({
            name: "New Pixel",
            pixel_id: "111222333",
          })
        );
      });

      expect(success!).toBe(false);
    });

    it("should handle response error on create", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { pixels: [] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { error: "Duplicate pixel" },
          error: null,
        });

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.createPixel(
          createPixelFormData({
            name: "New Pixel",
            pixel_id: "111222333",
          })
        );
      });

      expect(success!).toBe(false);
    });
  });

  describe("updatePixel", () => {
    it("should update pixel successfully", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { pixels: mockPixels },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {},
          error: null,
        })
        .mockResolvedValueOnce({
          data: { pixels: mockPixels },
          error: null,
        });

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.updatePixel(
          "pixel-1",
          createPixelFormData({
            name: "Updated Pixel",
            is_active: false,
          })
        );
      });

      expect(success!).toBe(true);
      expect(mockApiCall).toHaveBeenCalledWith(
        "pixel-management",
        expect.objectContaining({
          action: "update",
          pixelId: "pixel-1",
        })
      );
    });

    it("should return false on update error", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { pixels: mockPixels },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: new Error("Update failed"),
        });

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.updatePixel(
          "pixel-1",
          createPixelFormData({
            name: "Updated Pixel",
            is_active: false,
          })
        );
      });

      expect(success!).toBe(false);
    });
  });

  describe("deletePixel", () => {
    it("should delete pixel successfully", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { pixels: mockPixels },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {},
          error: null,
        })
        .mockResolvedValueOnce({
          data: { pixels: [mockPixels[1]] },
          error: null,
        });

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.deletePixel("pixel-1");
      });

      expect(success!).toBe(true);
      expect(mockApiCall).toHaveBeenCalledWith("pixel-management", {
        action: "delete",
        pixelId: "pixel-1",
      });
    });

    it("should return false on delete error", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { pixels: mockPixels },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { error: "Cannot delete" },
          error: null,
        });

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.deletePixel("pixel-1");
      });

      expect(success!).toBe(false);
    });
  });

  describe("refetch", () => {
    it("should refetch pixels", async () => {
      mockApiCall.mockResolvedValue({
        data: { pixels: mockPixels },
        error: null,
      });

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });
  });

  describe("saving state", () => {
    it("should set isSaving during create operation", async () => {
      let resolveFn: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolveFn = resolve;
      });

      mockApiCall
        .mockResolvedValueOnce({
          data: { pixels: [] },
          error: null,
        })
        .mockReturnValueOnce(promise);

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let createPromise: Promise<boolean>;
      act(() => {
        createPromise = result.current.createPixel(
          createPixelFormData({ name: "Test", pixel_id: "123" })
        );
      });

      expect(result.current.isSaving).toBe(true);

      await act(async () => {
        resolveFn!({ data: {}, error: null });
        await createPromise;
      });
    });
  });

  describe("loading state", () => {
    it("should start with isLoading true", () => {
      mockApiCall.mockResolvedValueOnce({
        data: { pixels: [] },
        error: null,
      });

      const { result } = renderHook(() => useVendorPixels());
      expect(result.current.isLoading).toBe(true);
    });

    it("should set isLoading false after fetch", async () => {
      mockApiCall.mockResolvedValueOnce({
        data: { pixels: [] },
        error: null,
      });

      const { result } = renderHook(() => useVendorPixels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
