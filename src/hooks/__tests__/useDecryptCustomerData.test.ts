/**
 * useDecryptCustomerData.test.ts
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Uses `as unknown as T` pattern for vi.mocked() calls.
 * Justification: vi.mocked requires full type match, but tests only need
 * the subset of properties actually consumed by the hook.
 * 
 * @module hooks/__tests__/useDecryptCustomerData
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

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

import { useDecryptCustomerData } from "../useDecryptCustomerData";
import { api } from "@/lib/api";

// Type alias for mock return type
type ApiCallReturn = ReturnType<typeof api.call>;

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

interface MockApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

function createMockApiSuccess<T>(data: T): MockApiResponse<T> {
  return {
    data,
    error: null,
  };
}

function createMockApiError(code: string, message: string): MockApiResponse<null> {
  return {
    data: null,
    error: { code, message },
  };
}

describe("useDecryptCustomerData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useDecryptCustomerData());

    expect(result.current.decryptedData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.accessType).toBeNull();
  });

  describe("decrypt function", () => {
    it("should set error when orderId is empty", async () => {
      const { result } = renderHook(() => useDecryptCustomerData());

      await act(async () => {
        await result.current.decrypt("");
      });

      expect(result.current.error).toBe("ID do pedido não informado");
    });

    it("should decrypt data successfully", async () => {
      const mockData = {
        customer_phone: "+5511999999999",
        customer_document: "12345678901",
      };

      // RISE V3 Justified: Partial mock - test only needs subset of API response
      vi.mocked(api.call).mockResolvedValueOnce(
        createMockApiSuccess({
          success: true,
          data: mockData,
          access_type: "vendor",
        }) as unknown as Awaited<ApiCallReturn>
      );

      const { result } = renderHook(() => useDecryptCustomerData());

      await act(async () => {
        await result.current.decrypt("order-123");
      });

      expect(result.current.decryptedData).toEqual(mockData);
      expect(result.current.accessType).toBe("vendor");
      expect(result.current.error).toBeNull();
    });

    it("should handle API error", async () => {
      vi.mocked(api.call).mockResolvedValueOnce(
        createMockApiError("FORBIDDEN", "Access denied") as unknown as Awaited<ApiCallReturn>
      );

      const { result } = renderHook(() => useDecryptCustomerData());

      await act(async () => {
        await result.current.decrypt("order-123");
      });

      expect(result.current.error).toBe("Access denied");
      expect(result.current.decryptedData).toBeNull();
    });

    it("should handle unsuccessful response", async () => {
      vi.mocked(api.call).mockResolvedValueOnce(
        createMockApiSuccess({ success: false, error: "Decryption failed" }) as unknown as Awaited<ApiCallReturn>
      );

      const { result } = renderHook(() => useDecryptCustomerData());

      await act(async () => {
        await result.current.decrypt("order-123");
      });

      expect(result.current.error).toBe("Decryption failed");
    });

    it("should set loading state during decrypt", async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(api.call).mockReturnValueOnce(promise as unknown as ApiCallReturn);

      const { result } = renderHook(() => useDecryptCustomerData());

      act(() => {
        result.current.decrypt("order-123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise(createMockApiSuccess({ success: true, data: {} }));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("reset function", () => {
    it("should reset all state", async () => {
      vi.mocked(api.call).mockResolvedValueOnce(
        createMockApiSuccess({
          success: true,
          data: { customer_phone: "+55" },
          access_type: "admin",
        }) as unknown as Awaited<ApiCallReturn>
      );

      const { result } = renderHook(() => useDecryptCustomerData());

      // First decrypt
      await act(async () => {
        await result.current.decrypt("order-123");
      });

      expect(result.current.decryptedData).not.toBeNull();

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.decryptedData).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.accessType).toBeNull();
    });
  });

  describe("autoDecrypt option", () => {
    it("should auto-decrypt when enabled and orderId provided", async () => {
      vi.mocked(api.call).mockResolvedValueOnce(
        createMockApiSuccess({
          success: true,
          data: { customer_phone: "+55" },
        }) as unknown as Awaited<ApiCallReturn>
      );

      const { result } = renderHook(() =>
        useDecryptCustomerData({
          autoDecrypt: true,
          orderId: "order-auto",
        })
      );

      await waitFor(() => {
        expect(result.current.decryptedData).not.toBeNull();
      });

      expect(api.call).toHaveBeenCalledWith("decrypt-customer-data", {
        order_id: "order-auto",
      });
    });

    it("should not auto-decrypt when disabled", () => {
      const { result } = renderHook(() =>
        useDecryptCustomerData({
          autoDecrypt: false,
          orderId: "order-123",
        })
      );

      expect(api.call).not.toHaveBeenCalled();
      expect(result.current.decryptedData).toBeNull();
    });

    it("should not auto-decrypt when orderId is undefined", () => {
      renderHook(() =>
        useDecryptCustomerData({
          autoDecrypt: true,
          orderId: undefined,
        })
      );

      expect(api.call).not.toHaveBeenCalled();
    });
  });
});
