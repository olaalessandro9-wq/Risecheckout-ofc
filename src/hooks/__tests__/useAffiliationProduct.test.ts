/**
 * useAffiliationProduct.test.ts
 * 
 * Tests for useAffiliationProduct hook
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock dependencies
vi.mock("@/lib/api/public-client", () => ({
  publicApi: {
    call: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import { useAffiliationProduct } from "../useAffiliationProduct";
import { publicApi } from "@/lib/api/public-client";

describe("useAffiliationProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set error when productId is undefined", async () => {
    const { result } = renderHook(() => useAffiliationProduct(undefined));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("ID do produto não informado");
    expect(result.current.product).toBeNull();
  });

  it("should fetch product data successfully", async () => {
    const mockProduct = {
      id: "prod-123",
      name: "Test Product",
      image_url: "https://example.com/image.jpg",
      affiliate_settings: {
        enabled: true,
        defaultRate: 10,
        cookieDuration: 30,
        attributionModel: "last_click",
        requireApproval: false,
      },
    };

    const mockOffers = [
      { id: "offer-1", name: "Main Offer", price: 9900 },
      { id: "offer-2", name: "VIP Offer", price: 19900 },
    ];

    vi.mocked(publicApi.call).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          product: mockProduct,
          offers: mockOffers,
        },
      },
      error: null,
    });

    const { result } = renderHook(() => useAffiliationProduct("prod-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.product).toEqual(mockProduct);
    expect(result.current.offers).toEqual(mockOffers);
    expect(result.current.error).toBeNull();
  });

  it("should handle API error", async () => {
    vi.mocked(publicApi.call).mockResolvedValueOnce({
      data: null,
      error: { code: "NETWORK_ERROR" as const, message: "Network error" },
    });

    const { result } = renderHook(() => useAffiliationProduct("prod-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.product).toBeNull();
  });

  it("should handle unsuccessful response", async () => {
    vi.mocked(publicApi.call).mockResolvedValueOnce({
      data: {
        success: false,
        error: "Produto não encontrado",
      },
      error: null,
    });

    const { result } = renderHook(() => useAffiliationProduct("prod-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Produto não encontrado");
  });

  it("should call API with correct parameters", async () => {
    vi.mocked(publicApi.call).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          product: { id: "prod-123", name: "Test" },
          offers: [],
        },
      },
      error: null,
    });

    renderHook(() => useAffiliationProduct("prod-123"));

    await waitFor(() => {
      expect(publicApi.call).toHaveBeenCalledWith("affiliation-public", {
        action: "all",
        productId: "prod-123",
      });
    });
  });

  it("should refetch when productId changes", async () => {
    vi.mocked(publicApi.call).mockResolvedValue({
      data: {
        success: true,
        data: {
          product: { id: "prod-123", name: "Test" },
          offers: [],
        },
      },
      error: null,
    });

    const { rerender } = renderHook(
      ({ productId }) => useAffiliationProduct(productId),
      { initialProps: { productId: "prod-1" } }
    );

    await waitFor(() => {
      expect(publicApi.call).toHaveBeenCalledTimes(1);
    });

    rerender({ productId: "prod-2" });

    await waitFor(() => {
      expect(publicApi.call).toHaveBeenCalledTimes(2);
    });
  });
});
