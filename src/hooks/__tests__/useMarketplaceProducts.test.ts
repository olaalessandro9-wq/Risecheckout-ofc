/**
 * useMarketplaceProducts.test.ts
 * 
 * Tests for useMarketplaceProducts hook
 * 
 * Uses `as unknown as T` pattern for vi.mocked() calls.
 * Justification: vi.mocked requires full type match, but tests only need
 * the subset of properties actually consumed by the hook.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock dependencies
vi.mock("@/services/marketplace", () => ({
  fetchMarketplaceProducts: vi.fn(),
  fetchMarketplaceCategories: vi.fn(),
}));

vi.mock("@/hooks/useAffiliationStatusCache", () => ({
  useAffiliationStatusCache: vi.fn(() => ({
    loadStatuses: vi.fn(),
  })),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import { useMarketplaceProducts } from "../useMarketplaceProducts";
import { fetchMarketplaceProducts, fetchMarketplaceCategories } from "@/services/marketplace";

// Type aliases for mock return types
type ProductsReturn = Awaited<ReturnType<typeof fetchMarketplaceProducts>>;
type CategoriesReturn = Awaited<ReturnType<typeof fetchMarketplaceCategories>>;

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

function createMockProducts(count: number = 2) {
  return Array.from({ length: count }, (_, i) => ({
    id: `prod-${i + 1}`,
    name: `Product ${i + 1}`,
    price: 9900 + i * 1000,
  }));
}

function createMockCategories() {
  return [
    { id: "cat-1", name: "Marketing", slug: "marketing", display_order: 1 },
  ];
}

describe("useMarketplaceProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMarketplaceProducts).mockResolvedValue([]);
    vi.mocked(fetchMarketplaceCategories).mockResolvedValue([]);
  });

  it("should initialize with default state", async () => {
    const { result } = renderHook(() => useMarketplaceProducts());

    expect(result.current.products).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.hasMore).toBe(true);
  });

  it("should fetch products on mount", async () => {
    const mockProducts = createMockProducts(2);
    // RISE V3 Justified: Partial mock - test only needs subset of product data
    vi.mocked(fetchMarketplaceProducts).mockResolvedValueOnce(mockProducts as unknown as ProductsReturn);

    const { result } = renderHook(() => useMarketplaceProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.products).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it("should fetch categories on mount", async () => {
    const mockCategories = createMockCategories();
    // RISE V3 Justified: Partial mock - test only needs subset of category data
    vi.mocked(fetchMarketplaceCategories).mockResolvedValueOnce(mockCategories as unknown as CategoriesReturn);

    const { result } = renderHook(() => useMarketplaceProducts());

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });
  });

  it("should handle fetch error", async () => {
    vi.mocked(fetchMarketplaceProducts).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useMarketplaceProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Network error");
  });

  it("should update hasMore based on response length", async () => {
    // Return less than limit (12)
    const singleProduct = [{ id: "1", name: "Only One" }];
    // RISE V3 Justified: Partial mock - test only needs subset of product data
    vi.mocked(fetchMarketplaceProducts).mockResolvedValueOnce(singleProduct as unknown as ProductsReturn);

    const { result } = renderHook(() => useMarketplaceProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(false);
  });

  it("should set filters and reset offset", async () => {
    vi.mocked(fetchMarketplaceProducts).mockResolvedValue([]);

    const { result } = renderHook(() => useMarketplaceProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ category: "marketing" });
    });

    expect(result.current.filters.category).toBe("marketing");
    expect(result.current.filters.offset).toBe(0);
  });

  it("should load more products", async () => {
    const firstPage = Array(12).fill({ id: "1", name: "Product" });
    const secondPage = Array(5).fill({ id: "2", name: "More" });

    // RISE V3 Justified: Partial mock - test only needs subset of product data
    vi.mocked(fetchMarketplaceProducts)
      .mockResolvedValueOnce(firstPage as unknown as ProductsReturn)
      .mockResolvedValueOnce(secondPage as unknown as ProductsReturn);

    const { result } = renderHook(() => useMarketplaceProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.products).toHaveLength(12);
    expect(result.current.hasMore).toBe(true);

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.products).toHaveLength(17);
    });
  });

  it("should not load more when already loading", async () => {
    vi.mocked(fetchMarketplaceProducts).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    const { result } = renderHook(() => useMarketplaceProducts());

    // Still loading from initial fetch
    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.loadMore();
    });

    // Should only have been called once (initial)
    expect(fetchMarketplaceProducts).toHaveBeenCalledTimes(1);
  });

  it("should refetch products", async () => {
    vi.mocked(fetchMarketplaceProducts).mockResolvedValue([]);

    const { result } = renderHook(() => useMarketplaceProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchMarketplaceProducts).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(fetchMarketplaceProducts).toHaveBeenCalledTimes(2);
    });
  });

  it("should pass filters to fetchMarketplaceProducts", async () => {
    vi.mocked(fetchMarketplaceProducts).mockResolvedValue([]);

    const { result } = renderHook(() => useMarketplaceProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setFilters({
        category: "cursos",
        search: "react",
        minCommission: 10,
      });
    });

    await waitFor(() => {
      expect(fetchMarketplaceProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          category: "cursos",
          search: "react",
          minCommission: 10,
          offset: 0,
        })
      );
    });
  });
});
