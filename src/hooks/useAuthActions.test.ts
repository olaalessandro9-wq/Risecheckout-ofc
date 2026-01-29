/**
 * useAuthActions Hook Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthActions } from "./useAuthActions";
import { api } from "@/lib/api";
import { unifiedTokenService } from "@/lib/token-manager";
import type { ReactNode } from "react";

vi.mock("@/lib/api", () => ({
  api: {
    publicCall: vi.fn(),
  },
}));

vi.mock("@/lib/token-manager", () => ({
  unifiedTokenService: {
    clearTokens: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return QueryClientProvider({ client: queryClient, children });
  };
}

describe("useAuthActions", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  describe("logout", () => {
    it("should call logout API", async () => {
      vi.mocked(api.publicCall).mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useAuthActions(), {
        wrapper: createWrapper(queryClient),
      });

      await result.current.logout();

      expect(api.publicCall).toHaveBeenCalledWith("unified-auth/logout", {});
    });

    it("should clear TokenService on logout", async () => {
      vi.mocked(api.publicCall).mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useAuthActions(), {
        wrapper: createWrapper(queryClient),
      });

      await result.current.logout();

      expect(unifiedTokenService.clearTokens).toHaveBeenCalled();
    });

    it("should set valid=false in query data on success", async () => {
      vi.mocked(api.publicCall).mockResolvedValue({ data: null, error: null });

      // Set initial authenticated state
      queryClient.setQueryData(["unified-auth"], { valid: true, user: { id: "1" } });

      const { result } = renderHook(() => useAuthActions(), {
        wrapper: createWrapper(queryClient),
      });

      await result.current.logout();

      const data = queryClient.getQueryData(["unified-auth"]) as { valid: boolean };
      expect(data.valid).toBe(false);
    });
  });

  describe("invalidate", () => {
    it("should invalidate auth query", async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useAuthActions(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.invalidate();

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["unified-auth"],
      });
    });
  });

  describe("isLoggingOut", () => {
    it("should be false initially", () => {
      const { result } = renderHook(() => useAuthActions(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoggingOut).toBe(false);
    });

    it("should be true during logout", async () => {
      // Create a promise we can control
      let resolveLogout: () => void;
      const logoutPromise = new Promise<void>((resolve) => {
        resolveLogout = resolve;
      });

      vi.mocked(api.publicCall).mockImplementation(() => logoutPromise.then(() => ({ data: null, error: null })));

      const { result } = renderHook(() => useAuthActions(), {
        wrapper: createWrapper(queryClient),
      });

      // Start logout (don't await)
      const logoutPromiseResult = result.current.logout();

      // Check isLoggingOut is true during the operation
      await waitFor(() => {
        expect(result.current.isLoggingOut).toBe(true);
      });

      // Resolve the logout
      resolveLogout!();
      await logoutPromiseResult;

      // Now it should be false
      await waitFor(() => {
        expect(result.current.isLoggingOut).toBe(false);
      });
    });
  });
});
