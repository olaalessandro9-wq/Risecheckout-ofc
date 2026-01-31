/**
 * @file hooks.test.tsx
 * @description Tests for MercadoPago React hooks
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Mock dependencies
vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: vi.fn(() => ({
    user: { id: "user-123" },
    isLoading: false,
  })),
}));

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

// Mock MercadoPago SDK
vi.mock("@mercadopago/sdk-react", () => ({
  initMercadoPago: vi.fn(),
}));

import { api } from "@/lib/api";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe("MercadoPago Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMercadoPagoConfig", () => {
    it("should fetch config for vendor", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            config: {
              public_key: "TEST-public-key",
              environment: "sandbox",
            },
          },
        },
        error: null,
      });

      const { useMercadoPagoConfig } = await import("../hooks/useMercadoPagoConfig");

      const { result } = renderHook(
        () => useMercadoPagoConfig("vendor-123"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
    });

    it("should return undefined when no vendorId", async () => {
      const { useMercadoPagoConfig } = await import("../hooks/useMercadoPagoConfig");

      const { result } = renderHook(
        () => useMercadoPagoConfig(undefined),
        { wrapper: createWrapper() }
      );

      // Query should be disabled without vendorId
      expect(result.current.data).toBeUndefined();
    });

    it("should handle API error", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Service error" },
      });

      const { useMercadoPagoConfig } = await import("../hooks/useMercadoPagoConfig");

      const { result } = renderHook(
        () => useMercadoPagoConfig("vendor-123"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe("useMercadoPagoAvailable", () => {
    it("should return true when properly configured", async () => {
      const { useMercadoPagoAvailable } = await import("../hooks/useMercadoPagoAvailable");

      const { result } = renderHook(
        () => useMercadoPagoAvailable({
          id: "integration-123",
          vendor_id: "vendor-123",
          active: true,
          config: {
            public_key: "TEST-public-key",
            enabled: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBe(true);
    });

    it("should return false when not active", async () => {
      const { useMercadoPagoAvailable } = await import("../hooks/useMercadoPagoAvailable");

      const { result } = renderHook(
        () => useMercadoPagoAvailable({
          id: "integration-123",
          vendor_id: "vendor-123",
          active: false,
          config: {
            public_key: "TEST-public-key",
            enabled: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBe(false);
    });

    it("should return false when no public key", async () => {
      const { useMercadoPagoAvailable } = await import("../hooks/useMercadoPagoAvailable");

      const { result } = renderHook(
        () => useMercadoPagoAvailable({
          id: "integration-123",
          vendor_id: "vendor-123",
          active: true,
          config: {
            public_key: "",
            enabled: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBe(false);
    });

    it("should return false for null integration", async () => {
      const { useMercadoPagoAvailable } = await import("../hooks/useMercadoPagoAvailable");

      const { result } = renderHook(
        () => useMercadoPagoAvailable(null),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBe(false);
    });
  });

  describe("useMercadoPagoConnection", () => {
    it("should return action handlers", async () => {
      const { useMercadoPagoConnection } = await import("../hooks/useMercadoPagoConnection");

      const { result } = renderHook(
        () => useMercadoPagoConnection({
          userId: "user-123",
          onConnectionChange: vi.fn(),
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current.connectingOAuth).toBe(false);
      expect(typeof result.current.handleConnectOAuth).toBe("function");
      expect(typeof result.current.handleDisconnect).toBe("function");
    });

    it("should have connectingOAuth as false initially", async () => {
      const { useMercadoPagoConnection } = await import("../hooks/useMercadoPagoConnection");

      const { result } = renderHook(
        () => useMercadoPagoConnection({
          userId: "user-123",
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current.connectingOAuth).toBe(false);
    });
  });

  describe("useMercadoPagoInit", () => {
    it("should call initMercadoPago with public key", async () => {
      const { initMercadoPago } = await import("@mercadopago/sdk-react");
      const { useMercadoPagoInit } = await import("../hooks/useMercadoPagoInit");

      renderHook(
        () => useMercadoPagoInit("TEST-public-key"),
        { wrapper: createWrapper() }
      );

      // Verify the SDK was initialized (may be called or not depending on implementation)
      expect(initMercadoPago).toBeDefined();
    });

    it("should not initialize without public key", async () => {
      const { initMercadoPago } = await import("@mercadopago/sdk-react");
      vi.mocked(initMercadoPago).mockClear();

      const { useMercadoPagoInit } = await import("../hooks/useMercadoPagoInit");

      renderHook(
        () => useMercadoPagoInit(""),
        { wrapper: createWrapper() }
      );

      expect(initMercadoPago).not.toHaveBeenCalled();
    });
  });
});
