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

// ============================================================================
// MOCKS
// ============================================================================

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: ({ to }: any) => <div data-testid="navigate-to">{to}</div>,
    useLocation: vi.fn(),
  };
});

// Mock useUnifiedAuth
vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: vi.fn(),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Loader2: ({ className }: any) => <div data-testid="loader-icon" className={className}>Loader2</div>,
}));

// ============================================================================
// TEST HELPERS
// ============================================================================

function mockAuth(config: {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  activeRole?: "producer" | "buyer" | "admin" | "owner";
}) {
  vi.mocked(UseUnifiedAuth.useUnifiedAuth).mockReturnValue({
    isAuthenticated: config.isAuthenticated,
    isAuthLoading: config.isAuthLoading,
    activeRole: config.activeRole || "producer",
    user: config.isAuthenticated ? { id: "1", email: "test@example.com" } : null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    switchContext: vi.fn(),
    refreshSession: vi.fn(),
  } as any);
}

const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;

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

  // ==========================================================================
  // LOADING STATES
  // ==========================================================================

  describe("Loading States", () => {
    it("should show loading spinner when auth is loading", () => {
      mockAuth({ isAuthenticated: false, isAuthLoading: true });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
      expect(screen.getByText("Verificando sessão...")).toBeInTheDocument();
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("should not show loading when auth is loaded", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "producer" });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================

  describe("Authentication", () => {
    it("should redirect to /auth when not authenticated (producer context)", () => {
      mockAuth({ isAuthenticated: false, isAuthLoading: false });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/auth");
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("should redirect to /minha-conta when not authenticated (buyer context)", () => {
      mockAuth({ isAuthenticated: false, isAuthLoading: false });

      render(
        <ContextAwareProtectedRoute requiredContext="buyer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/minha-conta");
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // PRODUCER CONTEXT
  // ==========================================================================

  describe("Producer Context", () => {
    it("should render children when authenticated as producer in producer route", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "producer" });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should redirect to buyer dashboard when buyer tries to access producer route", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "buyer" });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/minha-conta/dashboard");
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("should allow admin to access producer routes", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "admin" });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should allow owner to access producer routes", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "owner" });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // BUYER CONTEXT
  // ==========================================================================

  describe("Buyer Context", () => {
    it("should render children when authenticated as buyer in buyer route", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "buyer" });

      render(
        <ContextAwareProtectedRoute requiredContext="buyer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should redirect to producer dashboard when producer tries to access buyer route", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "producer" });

      render(
        <ContextAwareProtectedRoute requiredContext="buyer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard");
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("should redirect admin to producer dashboard when trying to access buyer route", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "admin" });

      render(
        <ContextAwareProtectedRoute requiredContext="buyer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard");
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("should redirect owner to producer dashboard when trying to access buyer route", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "owner" });

      render(
        <ContextAwareProtectedRoute requiredContext="buyer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard");
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle loading state with authenticated user", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: true, activeRole: "producer" });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      // Loading takes precedence
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("should render loading UI with proper styling", () => {
      mockAuth({ isAuthenticated: false, isAuthLoading: true });

      const { container } = render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      const loadingContainer = container.querySelector(".min-h-screen");
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveClass("flex", "items-center", "justify-center");
    });
  });
});
