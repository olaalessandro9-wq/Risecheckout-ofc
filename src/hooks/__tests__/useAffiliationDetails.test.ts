/**
 * useAffiliationDetails.test.ts
 * 
 * Tests for useAffiliationDetails hook
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock dependencies
vi.mock("@/lib/api", () => ({
  api: {
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

import { useAffiliationDetails } from "../useAffiliationDetails";
import { api } from "@/lib/api";

describe("useAffiliationDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set error when affiliationId is undefined", async () => {
    const { result } = renderHook(() => useAffiliationDetails(undefined));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("ID da afiliação não fornecido");
    expect(result.current.affiliation).toBeNull();
  });

  it("should fetch affiliation details successfully", async () => {
    const mockAffiliation = {
      id: "aff-123",
      affiliate_code: "ABC123",
      commission_rate: 10,
      status: "active",
      total_sales_count: 5,
      total_sales_amount: 10000,
      created_at: "2024-01-01T00:00:00Z",
      product: {
        id: "prod-123",
        name: "Test Product",
        price: 9900,
      },
      offers: [{ id: "offer-1", name: "Main Offer", price: 9900 }],
      checkouts: [],
      producer: { id: "user-123", name: "Producer Name" },
      pixels: [],
      pix_gateway: "mercadopago",
      credit_card_gateway: "stripe",
      allowed_gateways: {
        pix_allowed: ["mercadopago"],
        credit_card_allowed: ["stripe"],
        require_gateway_connection: false,
      },
    };

    vi.mocked(api.call).mockResolvedValueOnce({
      data: {
        affiliation: mockAffiliation,
        otherProducts: [],
      },
      error: null,
    });

    const { result } = renderHook(() => useAffiliationDetails("aff-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.affiliation).toBeDefined();
    expect(result.current.affiliation?.affiliate_code).toBe("ABC123");
    expect(result.current.affiliation?.commission_rate).toBe(10);
    expect(result.current.error).toBeNull();
  });

  it("should set other products from response", async () => {
    const mockOtherProducts = [
      { id: "prod-2", name: "Other Product", image_url: null, price: 5000, commission_percentage: 15 },
    ];

    vi.mocked(api.call).mockResolvedValueOnce({
      data: {
        affiliation: {
          id: "aff-123",
          affiliate_code: "ABC",
          commission_rate: 10,
          status: "active",
          created_at: "2024-01-01",
        },
        otherProducts: mockOtherProducts,
      },
      error: null,
    });

    const { result } = renderHook(() => useAffiliationDetails("aff-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.otherProducts).toHaveLength(1);
    expect(result.current.otherProducts[0].name).toBe("Other Product");
  });

  it("should handle API error", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: null,
      error: { code: "NETWORK_ERROR" as const, message: "Network error" },
    });

    const { result } = renderHook(() => useAffiliationDetails("aff-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.affiliation).toBeNull();
  });

  it("should handle data error response", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: { error: "Afiliação não encontrada" },
      error: null,
    });

    const { result } = renderHook(() => useAffiliationDetails("aff-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Afiliação não encontrada");
  });

  it("should refetch when called", async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: {
        affiliation: {
          id: "aff-123",
          affiliate_code: "ABC",
          commission_rate: 10,
          status: "active",
          created_at: "2024-01-01",
        },
        otherProducts: [],
      },
      error: null,
    });

    const { result } = renderHook(() => useAffiliationDetails("aff-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // First call on mount
    expect(api.call).toHaveBeenCalledTimes(1);

    // Trigger refetch
    await result.current.refetch();

    expect(api.call).toHaveBeenCalledTimes(2);
  });
});
