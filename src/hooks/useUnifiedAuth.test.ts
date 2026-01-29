/**
 * useUnifiedAuth - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the unified authentication hook.
 * Covers React Query integration and derived state.
 * 
 * @module hooks/useUnifiedAuth.test
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { useUnifiedAuth } from "./useUnifiedAuth";
import React from "react";

// ============================================================================
// CONSTANTS
// ============================================================================

const API_URL = "https://api.risecheckout.com/functions/v1";

// ============================================================================
// TEST DATA
// ============================================================================

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  timezone: "America/Sao_Paulo",
};

const mockAuthResponse = {
  valid: true,
  user: mockUser,
  roles: ["seller", "buyer"] as const,
  activeRole: "seller",
  expiresIn: 14400,
};

// ============================================================================
// MOCKS
// ============================================================================

// Mock token-manager to prevent side effects
vi.mock("@/lib/token-manager", () => ({
  unifiedTokenService: {
    isInitialized: vi.fn(() => false),
    initialize: vi.fn(),
    setAuthenticated: vi.fn(),
    clearTokens: vi.fn(),
    refresh: vi.fn().mockResolvedValue(false),
  },
}));

// Mock session-commander to prevent side effects
vi.mock("@/lib/session-commander", () => ({
  sessionCommander: {
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
  },
}));

// Mock logger to suppress output
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: React.ReactNode;
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: WrapperProps) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ============================================================================
// TESTS: INITIAL STATE
// ============================================================================

describe("useUnifiedAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    beforeEach(() => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.json({ valid: false });
        })
      );
    });

    it("should start with loading state", async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it("should resolve to unauthenticated when no session", async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.roles).toEqual([]);
      expect(result.current.activeRole).toBeNull();
    });

    it("should provide all expected properties", async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // State properties
      expect(result.current).toHaveProperty("isAuthenticated");
      expect(result.current).toHaveProperty("isAuthLoading");
      expect(result.current).toHaveProperty("isSyncing");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("user");
      expect(result.current).toHaveProperty("roles");
      expect(result.current).toHaveProperty("activeRole");
      expect(result.current).toHaveProperty("expiresIn");

      // Role checks
      expect(result.current).toHaveProperty("isProducer");
      expect(result.current).toHaveProperty("isBuyer");
      expect(result.current).toHaveProperty("canSwitchToProducer");
      expect(result.current).toHaveProperty("canSwitchToBuyer");

      // Actions
      expect(result.current).toHaveProperty("login");
      expect(result.current).toHaveProperty("logout");
      expect(result.current).toHaveProperty("switchToProducer");
      expect(result.current).toHaveProperty("switchToBuyer");
      expect(result.current).toHaveProperty("switchContext");
      expect(result.current).toHaveProperty("refresh");
      expect(result.current).toHaveProperty("invalidate");

      // Mutation states
      expect(result.current).toHaveProperty("isLoggingIn");
      expect(result.current).toHaveProperty("isLoggingOut");
      expect(result.current).toHaveProperty("isSwitching");
      expect(result.current).toHaveProperty("loginError");
    });

    it("should have functions as actions", async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.login).toBe("function");
      expect(typeof result.current.logout).toBe("function");
      expect(typeof result.current.switchToProducer).toBe("function");
      expect(typeof result.current.switchToBuyer).toBe("function");
      expect(typeof result.current.switchContext).toBe("function");
      expect(typeof result.current.refresh).toBe("function");
      expect(typeof result.current.invalidate).toBe("function");
    });
  });

  // ============================================================================
  // TESTS: AUTHENTICATED STATE
  // ============================================================================

  describe("Authenticated State", () => {
    beforeEach(() => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.json(mockAuthResponse);
        })
      );
    });

    it("should resolve to authenticated with user data", async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.roles).toEqual(["seller", "buyer"]);
      expect(result.current.activeRole).toBe("seller");
      expect(result.current.expiresIn).toBe(14400);
    });

    it("should correctly derive isProducer for seller role", async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.isProducer).toBe(true);
      expect(result.current.isBuyer).toBe(false);
    });

    it("should correctly derive isBuyer for buyer role", async () => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.json({
            ...mockAuthResponse,
            activeRole: "buyer",
          });
        })
      );

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.isProducer).toBe(false);
      expect(result.current.isBuyer).toBe(true);
    });

    it("should correctly derive canSwitchToProducer", async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.canSwitchToProducer).toBe(true);
      expect(result.current.canSwitchToBuyer).toBe(true);
    });

    it("should correctly derive canSwitchToProducer as false for buyer-only user", async () => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.json({
            ...mockAuthResponse,
            roles: ["buyer"],
            activeRole: "buyer",
          });
        })
      );

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.canSwitchToProducer).toBe(false);
      expect(result.current.canSwitchToBuyer).toBe(true);
    });
  });

  // ============================================================================
  // TESTS: ROLE HIERARCHY
  // ============================================================================

  describe("Role Hierarchy", () => {
    const producerRoles = ["owner", "admin", "user", "seller"] as const;

    producerRoles.forEach((role) => {
      it(`should identify ${role} as producer`, async () => {
        server.use(
          http.post(`${API_URL}/unified-auth/validate`, () => {
            return HttpResponse.json({
              valid: true,
              user: mockUser,
              roles: [role],
              activeRole: role,
              expiresIn: 14400,
            });
          })
        );

        const { result } = renderHook(() => useUnifiedAuth(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isAuthenticated).toBe(true);
        });

        expect(result.current.isProducer).toBe(true);
        expect(result.current.isBuyer).toBe(false);
      });
    });

    it("should identify buyer as buyer", async () => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.json({
            valid: true,
            user: mockUser,
            roles: ["buyer"],
            activeRole: "buyer",
            expiresIn: 14400,
          });
        })
      );

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.isProducer).toBe(false);
      expect(result.current.isBuyer).toBe(true);
    });
  });

  // ============================================================================
  // TESTS: LOADING STATES
  // ============================================================================

  describe("Loading States", () => {
    beforeEach(() => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.json({ valid: false });
        })
      );
    });

    it("should have isAuthLoading alias for isLoading", async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      // At start, both should be true
      expect(result.current.isLoading).toBe(result.current.isAuthLoading);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // After loading, both should be false
      expect(result.current.isLoading).toBe(result.current.isAuthLoading);
    });

    it("should have isSyncing false when not refetching", async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSyncing).toBe(false);
    });

    it("should have mutation flags as false initially", async () => {
      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoggingIn).toBe(false);
      expect(result.current.isLoggingOut).toBe(false);
      expect(result.current.isSwitching).toBe(false);
      expect(result.current.loginError).toBeNull();
    });
  });

  // ============================================================================
  // TESTS: ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not crash, should be unauthenticated
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it("should handle 500 errors gracefully", async () => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not crash, should be unauthenticated
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle 401 response gracefully", async () => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.json(
            { valid: false, error: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle malformed response gracefully", async () => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.json({ unexpected: "data" });
        })
      );

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should default to unauthenticated when valid is not true
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  // ============================================================================
  // TESTS: EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle empty roles array", async () => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.json({
            valid: true,
            user: mockUser,
            roles: [],
            activeRole: null,
            expiresIn: 14400,
          });
        })
      );

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.roles).toEqual([]);
      expect(result.current.activeRole).toBeNull();
      expect(result.current.isProducer).toBe(false);
      expect(result.current.isBuyer).toBe(false);
    });

    it("should handle missing optional fields", async () => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.json({
            valid: true,
            user: { id: "123", email: "test@test.com" },
          });
        })
      );

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.id).toBe("123");
      expect(result.current.roles).toEqual([]);
      expect(result.current.expiresIn).toBeNull();
    });

    it("should call invalidate without throwing", async () => {
      server.use(
        http.post(`${API_URL}/unified-auth/validate`, () => {
          return HttpResponse.json(mockAuthResponse);
        })
      );

      const { result } = renderHook(() => useUnifiedAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Should not throw
      expect(() => {
        act(() => {
          result.current.invalidate();
        });
      }).not.toThrow();
    });
  });
});
