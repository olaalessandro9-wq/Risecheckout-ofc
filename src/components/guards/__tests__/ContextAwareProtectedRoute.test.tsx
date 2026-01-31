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
import type { AppRole } from "@/hooks/usePermissions";
import type { UnifiedUser } from "@/hooks/useUnifiedAuth";

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
// TYPE-SAFE FACTORIES
// ============================================================================

function createMockUser(overrides: Partial<UnifiedUser> = {}): UnifiedUser {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    timezone: "America/Sao_Paulo",
    ...overrides,
  };
}

function createMockAuthState(config: {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  activeRole?: AppRole | "buyer";
}) {
  const activeRole = config.activeRole ?? "user";
  return {
    isAuthenticated: config.isAuthenticated,
    isAuthLoading: config.isAuthLoading,
    isSyncing: false,
    isLoading: config.isAuthLoading,
    isRefetching: false,
    activeRole: activeRole as AppRole | "buyer" | null,
    user: config.isAuthenticated ? createMockUser() : null,
    roles: [] as AppRole[],
    expiresIn: null,
    isProducer: activeRole !== "buyer",
    isBuyer: activeRole === "buyer",
    canSwitchToProducer: true,
    canSwitchToBuyer: true,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    switchContext: vi.fn(),
    switchToProducer: vi.fn(),
    switchToBuyer: vi.fn(),
    refresh: vi.fn(),
    refreshSession: vi.fn(),
    invalidate: vi.fn(),
    isLoggingIn: false,
    isLoggingOut: false,
    isSwitching: false,
    loginError: null as string | null,
  };
}

// ============================================================================
// TEST HELPERS
// ============================================================================

function mockAuth(config: {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  activeRole?: AppRole | "buyer";
}) {
  vi.mocked(UseUnifiedAuth.useUnifiedAuth).mockReturnValue(createMockAuthState(config));
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
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "user" });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

      expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

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

  describe("Producer Context", () => {
    it("should render children when authenticated as producer in producer route", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "user" });

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
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "user" });

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

  describe("Edge Cases", () => {
    it("should handle loading state with authenticated user", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: true, activeRole: "user" });

      render(
        <ContextAwareProtectedRoute requiredContext="producer">
          <ProtectedContent />
        </ContextAwareProtectedRoute>
      );

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
