/**
 * @file ContextAwareProtectedRoute.test.tsx
 * @description Tests for ContextAwareProtectedRoute component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { ContextAwareProtectedRoute } from "../ContextAwareProtectedRoute";
import * as ReactRouterDOM from "react-router-dom";
import * as UseUnifiedAuth from "@/hooks/useUnifiedAuth";
import { createMockAuthState, ProtectedContent } from "./test-helpers.tsx";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
    useLocation: vi.fn(),
  };
});

vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader-icon" className={className}>Loader2</div>,
}));

// ============================================================================
// TEST HELPERS
// ============================================================================

function mockAuth(config: Parameters<typeof createMockAuthState>[0]) {
  vi.mocked(UseUnifiedAuth.useUnifiedAuth).mockReturnValue(createMockAuthState(config));
}

// ============================================================================
// TESTS
// ============================================================================

describe("ContextAwareProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ReactRouterDOM.useLocation).mockReturnValue({
      pathname: "/test",
      search: "",
      hash: "",
      state: null,
      key: "default",
    });
  });

  describe("Loading States", () => {
    it("should show loading spinner when auth is loading", () => {
      mockAuth({ isAuthenticated: false, isAuthLoading: true });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });
  });

  describe("Authentication Guard", () => {
    it("should redirect to /auth when not authenticated", () => {
      mockAuth({ isAuthenticated: false, isAuthLoading: false });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/auth");
    });

    it("should allow access when authenticated with correct context", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "user" });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

  describe("Role-based Access", () => {
    it("should allow access when user has producer context", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "user" });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should redirect to /minha-conta/dashboard when buyer tries producer route", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "buyer" });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/minha-conta/dashboard");
    });
  });
});
