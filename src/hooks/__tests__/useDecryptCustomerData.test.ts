/**
 * useDecryptCustomerData.test.ts
 * 
 * Tests for useDecryptCustomerData hook
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
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

      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          data: mockData,
          access_type: "vendor",
        },
        error: null,
      });

      const { result } = renderHook(() => useDecryptCustomerData());

      await act(async () => {
        await result.current.decrypt("order-123");
      });

      expect(result.current.decryptedData).toEqual(mockData);
      expect(result.current.accessType).toBe("vendor");
      expect(result.current.error).toBeNull();
    });

    it("should handle API error", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { code: "FORBIDDEN" as const, message: "Access denied" },
      });

      const { result } = renderHook(() => useDecryptCustomerData());

      await act(async () => {
        await result.current.decrypt("order-123");
      });

      expect(result.current.error).toBe("Access denied");
      expect(result.current.decryptedData).toBeNull();
    });

    it("should handle unsuccessful response", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: false, error: "Decryption failed" },
        error: null,
      });

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

      vi.mocked(api.call).mockReturnValueOnce(promise as never);

      const { result } = renderHook(() => useDecryptCustomerData());

      act(() => {
        result.current.decrypt("order-123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise({ data: { success: true, data: {} }, error: null });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("reset function", () => {
    it("should reset all state", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          data: { customer_phone: "+55" },
          access_type: "admin",
        },
        error: null,
      });

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
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          data: { customer_phone: "+55" },
        },
        error: null,
      });

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
