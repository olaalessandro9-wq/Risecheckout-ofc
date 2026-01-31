/**
 * @file hooks.test.tsx
 * @description Tests for PushinPay React hooks
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Mock dependencies
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
    publicCall: vi.fn(),
  },
}));

import { api } from "@/lib/api";
import { usePushinPayConfig, usePushinPayAvailable } from "../hooks";
import type { PushinPayIntegration } from "../types";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

/**
 * Creates a mock PushinPayIntegration for testing
 */
function createMockIntegration(
  overrides?: Partial<PushinPayIntegration>
): PushinPayIntegration {
  return {
    id: "integration-123",
    vendor_id: "vendor-123",
    integration_type: "PUSHINPAY",
    active: true,
    config: {
      pushinpay_token: "token-xxx",
      environment: "production",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("PushinPay Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("usePushinPayConfig", () => {
    it("should fetch config for vendor", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: {
          success: true,
          data: createMockIntegration(),
        },
        error: null,
      });

      const { result } = renderHook(
        () => usePushinPayConfig("vendor-123"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(api.publicCall).toHaveBeenCalledWith("vendor-integrations", {
        action: "get-config",
        vendorId: "vendor-123",
        integrationType: "PUSHINPAY",
      });
    });

    it("should return undefined when no vendorId", async () => {
      const { result } = renderHook(
        () => usePushinPayConfig(undefined),
        { wrapper: createWrapper() }
      );

      // Should not fetch without vendorId
      expect(api.publicCall).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it("should handle API error", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Service error" },
      });

      const { result } = renderHook(
        () => usePushinPayConfig("vendor-123"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });

    it("should handle exception", async () => {
      vi.mocked(api.publicCall).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(
        () => usePushinPayConfig("vendor-123"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });

    it("should cache results", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: {
          success: true,
          data: createMockIntegration(),
        },
        error: null,
      });

      const wrapper = createWrapper();

      const { result: result1 } = renderHook(
        () => usePushinPayConfig("vendor-123"),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      // Second render should use cache
      const { result: result2 } = renderHook(
        () => usePushinPayConfig("vendor-123"),
        { wrapper }
      );

      expect(api.publicCall).toHaveBeenCalledTimes(1);
      expect(result2.current.data).toBeDefined();
    });
  });

  describe("usePushinPayAvailable", () => {
    it("should return true when properly configured", () => {
      const integration = createMockIntegration();

      const { result } = renderHook(
        () => usePushinPayAvailable(integration),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBe(true);
    });

    it("should return false when not active", () => {
      const integration = createMockIntegration({ active: false });

      const { result } = renderHook(
        () => usePushinPayAvailable(integration),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBe(false);
    });

    it("should return false when no token in config", () => {
      const integration = createMockIntegration({
        config: {
          pushinpay_token: "",
          environment: "production",
        },
      });

      const { result } = renderHook(
        () => usePushinPayAvailable(integration),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBe(false);
    });

    it("should return false for null integration", () => {
      const { result } = renderHook(
        () => usePushinPayAvailable(null),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBe(false);
    });

    it("should return false for undefined integration", () => {
      const { result } = renderHook(
        () => usePushinPayAvailable(undefined),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBe(false);
    });

    it("should return true with pushinpay_token", () => {
      const integration = createMockIntegration({
        config: {
          pushinpay_token: "token-xxx",
          environment: "production",
        },
      });

      const { result } = renderHook(
        () => usePushinPayAvailable(integration),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBe(true);
    });
  });
});
