/**
 * useDecryptCustomerBatch.test.ts
 * 
 * Tests for useDecryptCustomerBatch hook
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock api module
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

import { useDecryptCustomerBatch } from "../useDecryptCustomerBatch";
import { api } from "@/lib/api";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useDecryptCustomerBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty map when orderIds is empty", async () => {
    const { result } = renderHook(
      () => useDecryptCustomerBatch([]),
      { wrapper: createWrapper() }
    );

    // Should not call API for empty array
    expect(api.call).not.toHaveBeenCalled();
    expect(result.current.decryptedMap).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch decrypted data for order IDs", async () => {
    const mockData = {
      "order-1": { customer_phone: "+5511999999999", customer_email: "test@example.com" },
      "order-2": { customer_phone: "+5511888888888", customer_email: "test2@example.com" },
    };

    vi.mocked(api.call).mockResolvedValueOnce({
      data: { success: true, data: mockData },
      error: null,
    });

    const { result } = renderHook(
      () => useDecryptCustomerBatch(["order-1", "order-2"]),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.decryptedMap).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("should handle API error", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: null,
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });

    const { result } = renderHook(
      () => useDecryptCustomerBatch(["order-1"]),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Unauthorized");
    expect(result.current.decryptedMap).toEqual({});
  });

  it("should handle unsuccessful response", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: { success: false, error: "Decryption failed" },
      error: null,
    });

    const { result } = renderHook(
      () => useDecryptCustomerBatch(["order-1"]),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Decryption failed");
  });

  it("should not fetch when enabled is false", async () => {
    const { result } = renderHook(
      () => useDecryptCustomerBatch(["order-1"], false),
      { wrapper: createWrapper() }
    );

    expect(api.call).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("should call API with correct parameters", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: { success: true, data: {} },
      error: null,
    });

    renderHook(
      () => useDecryptCustomerBatch(["order-1", "order-2"]),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(api.call).toHaveBeenCalledWith(
        "decrypt-customer-data-batch",
        {
          order_ids: ["order-1", "order-2"],
          fields: ["customer_phone", "customer_email"],
        }
      );
    });
  });

  it("should use consistent query key based on sorted order IDs", async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: { success: true, data: {} },
      error: null,
    });

    const { rerender } = renderHook(
      ({ orderIds }) => useDecryptCustomerBatch(orderIds),
      {
        wrapper: createWrapper(),
        initialProps: { orderIds: ["order-2", "order-1"] },
      }
    );

    await waitFor(() => expect(api.call).toHaveBeenCalledTimes(1));

    // Same IDs in different order should not trigger new fetch
    rerender({ orderIds: ["order-1", "order-2"] });

    // Should still be just 1 call (same sorted key)
    expect(api.call).toHaveBeenCalledTimes(1);
  });
});
