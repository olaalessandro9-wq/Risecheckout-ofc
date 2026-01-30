/**
 * usePaymentAccountCheck.test.ts
 * 
 * Tests for usePaymentAccountCheck hook
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

vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: vi.fn(() => ({
    user: { id: "test-user-id" },
  })),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import { usePaymentAccountCheck } from "../usePaymentAccountCheck";
import { api } from "@/lib/api";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

describe("usePaymentAccountCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return not connected when no user", async () => {
    vi.mocked(useUnifiedAuth).mockReturnValueOnce({
      user: null,
    } as ReturnType<typeof useUnifiedAuth>);

    const { result } = renderHook(() => usePaymentAccountCheck());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPaymentAccount).toBe(false);
    expect(result.current.hasMercadoPago).toBe(false);
    expect(result.current.hasStripe).toBe(false);
  });

  it("should fetch payment account status", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: {
        hasPaymentAccount: true,
        hasMercadoPago: true,
        hasStripe: false,
      },
      error: null,
    });

    const { result } = renderHook(() => usePaymentAccountCheck());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPaymentAccount).toBe(true);
    expect(result.current.hasMercadoPago).toBe(true);
    expect(result.current.hasStripe).toBe(false);
  });

  it("should handle both gateways connected", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: {
        hasPaymentAccount: true,
        hasMercadoPago: true,
        hasStripe: true,
      },
      error: null,
    });

    const { result } = renderHook(() => usePaymentAccountCheck());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPaymentAccount).toBe(true);
    expect(result.current.hasMercadoPago).toBe(true);
    expect(result.current.hasStripe).toBe(true);
  });

  it("should handle API error gracefully", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: null,
      error: { code: "NETWORK_ERROR" as const, message: "Network error" },
    });

    const { result } = renderHook(() => usePaymentAccountCheck());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPaymentAccount).toBe(false);
    expect(result.current.hasMercadoPago).toBe(false);
    expect(result.current.hasStripe).toBe(false);
  });

  it("should call API with correct action", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: { hasPaymentAccount: false },
      error: null,
    });

    renderHook(() => usePaymentAccountCheck());

    await waitFor(() => {
      expect(api.call).toHaveBeenCalledWith("admin-data", {
        action: "user-gateway-status",
      });
    });
  });

  it("should update when user changes", async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: { hasPaymentAccount: true, hasMercadoPago: true, hasStripe: false },
      error: null,
    });

    const { result, rerender } = renderHook(() => usePaymentAccountCheck());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.call).toHaveBeenCalledTimes(1);

    // Simulate user ID change
    vi.mocked(useUnifiedAuth).mockReturnValue({
      user: { id: "new-user-id" },
    } as ReturnType<typeof useUnifiedAuth>);

    rerender();

    await waitFor(() => {
      expect(api.call).toHaveBeenCalledTimes(2);
    });
  });
});
