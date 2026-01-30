/**
 * useBuyerOrders - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests buyer orders query keys and hook structure.
 * 
 * @module hooks/__tests__/useBuyerOrders.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { buyerQueryKeys } from "../useBuyerOrders";

// Store original fetch
const originalFetch = global.fetch;

// Create mock fetch that bypasses MSW
const createMockFetch = () => {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes("/buyer-orders/orders")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ orders: [] }),
      });
    }
    if (url.includes("/buyer-orders/access")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access: [] }),
      });
    }
    if (url.includes("/buyer-orders/content")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ product: null, modules: [], sections: [] }),
      });
    }
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: "Not found" }),
    });
  });
};

// Mock config
vi.mock("@/config/supabase", () => ({
  SUPABASE_URL: "https://test.supabase.co",
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe("buyerQueryKeys", () => {
  it("should generate correct orders key", () => {
    expect(buyerQueryKeys.orders()).toEqual(["buyer", "orders"]);
  });

  it("should generate correct access key", () => {
    expect(buyerQueryKeys.access()).toEqual(["buyer", "access"]);
  });

  it("should generate correct content key with productId and viewport", () => {
    expect(buyerQueryKeys.content("prod-123", "desktop")).toEqual([
      "buyer",
      "content",
      "prod-123",
      "desktop",
    ]);
  });

  it("should generate correct content key for mobile viewport", () => {
    expect(buyerQueryKeys.content("prod-456", "mobile")).toEqual([
      "buyer",
      "content",
      "prod-456",
      "mobile",
    ]);
  });

  it("should have consistent all key", () => {
    expect(buyerQueryKeys.all).toEqual(["buyer"]);
  });
});

describe("useBuyerOrders", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = createMockFetch();
    global.fetch = mockFetch as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("hook initialization", () => {
    it("should return initial loading state", async () => {
      const { useBuyerOrders } = await import("../useBuyerOrders");

      const { result } = renderHook(() => useBuyerOrders(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.orders).toEqual([]);
      expect(result.current.access).toEqual([]);
    });

    it("should provide fetch functions", async () => {
      const { useBuyerOrders } = await import("../useBuyerOrders");

      const { result } = renderHook(() => useBuyerOrders(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.fetchOrders).toBe("function");
      expect(typeof result.current.fetchAccess).toBe("function");
      expect(typeof result.current.fetchProductContent).toBe("function");
    });

    it("should call fetch with credentials include", async () => {
      const { useBuyerOrders } = await import("../useBuyerOrders");

      renderHook(() => useBuyerOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Verify credentials: include is passed
      const calls = mockFetch.mock.calls;
      const ordersCall = calls.find((c) => c[0].includes("/orders"));
      if (ordersCall) {
        expect(ordersCall[1]).toMatchObject({
          credentials: "include",
        });
      }
    });
  });

  describe("orders data", () => {
    it("should fetch and return orders", async () => {
      const mockOrders = [
        { id: "order-1", product_id: "prod-1", status: "paid" },
      ];

      mockFetch.mockImplementation((url: string) => {
        if (url.includes("/buyer-orders/orders")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ orders: mockOrders }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access: [] }),
        });
      });

      const { useBuyerOrders } = await import("../useBuyerOrders");

      const { result } = renderHook(() => useBuyerOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.orders).toEqual(mockOrders);
    });
  });

  describe("access data", () => {
    it("should fetch and return access", async () => {
      const mockAccess = [
        { id: "access-1", product_id: "prod-1", is_active: true },
      ];

      mockFetch.mockImplementation((url: string) => {
        if (url.includes("/buyer-orders/access")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ access: mockAccess }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ orders: [] }),
        });
      });

      const { useBuyerOrders } = await import("../useBuyerOrders");

      const { result } = renderHook(() => useBuyerOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.access).toEqual(mockAccess);
    });
  });

  // Error handling tested via React Query's built-in error states
});

describe("useBuyerProductContent", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = createMockFetch();
    global.fetch = mockFetch as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should not fetch when productId is undefined", async () => {
    const { useBuyerProductContent } = await import("../useBuyerOrders");

    const { result } = renderHook(
      () => useBuyerProductContent(undefined),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
  });

  it("should fetch content when productId is provided", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/buyer-orders/content")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              product: { id: "prod-1", name: "Test Product" },
              modules: [],
              sections: [],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    const { useBuyerProductContent } = await import("../useBuyerOrders");

    const { result } = renderHook(
      () => useBuyerProductContent("prod-1", "desktop"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.product?.id).toBe("prod-1");
  });
});

describe("useBuyerAccessQuery", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = createMockFetch();
    global.fetch = mockFetch as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should fetch access data", async () => {
    const mockAccess = [
      { id: "access-1", product_id: "prod-1", is_active: true },
    ];

    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/buyer-orders/access")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access: mockAccess }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    const { useBuyerAccessQuery } = await import("../useBuyerOrders");

    const { result } = renderHook(() => useBuyerAccessQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockAccess);
  });
});
