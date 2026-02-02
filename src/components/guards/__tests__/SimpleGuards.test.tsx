/**
 * @file SimpleGuards.test.tsx
 * @description Tests for simple guard components (BuyerRoute, ProducerRoute, MarketplaceRoute)
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { BuyerRoute } from "../BuyerRoute";
import { ProducerRoute } from "../ProducerRoute";
import { MarketplaceRoute } from "../MarketplaceRoute";
import * as ReactRouterDOM from "react-router-dom";
import * as UseUnifiedAuth from "@/hooks/useUnifiedAuth";
import * as UsePermissions from "@/hooks/usePermissions";
import { createMockAuthState, createMockPermissions, ProtectedContent } from "./test-helpers.tsx";

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

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

vi.mock("@/pages/EmBreve", () => ({
  default: () => <div data-testid="em-breve">Em Breve</div>,
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ReactRouterDOM.useLocation).mockReturnValue({
    pathname: "/test",
    search: "",
    hash: "",
    state: null,
    key: "test",
  });
});

// ============================================================================
// TESTS
// ============================================================================

describe("SimpleGuards", () => {
  describe("BuyerRoute", () => {
    it("should render children when authenticated as buyer", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "buyer" });

      render(
        <BuyerRoute>
          <ProtectedContent />
        </BuyerRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should redirect to /minha-conta when not authenticated", () => {
      mockAuth({ isAuthenticated: false, isAuthLoading: false });

      render(
        <BuyerRoute>
          <ProtectedContent />
        </BuyerRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/minha-conta");
    });

    it("should redirect to /dashboard when producer tries to access", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "user" });

      render(
        <BuyerRoute>
          <ProtectedContent />
        </BuyerRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard");
    });

    it("should show loading spinner when auth is loading", () => {
      mockAuth({ isAuthenticated: false, isAuthLoading: true });

      render(
        <BuyerRoute>
          <ProtectedContent />
        </BuyerRoute>
      );

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });
  });

  describe("ProducerRoute", () => {
    it("should render children when authenticated as producer", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "user" });

      render(
        <ProducerRoute>
          <ProtectedContent />
        </ProducerRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should redirect to /auth when not authenticated", () => {
      mockAuth({ isAuthenticated: false, isAuthLoading: false });

      render(
        <ProducerRoute>
          <ProtectedContent />
        </ProducerRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/auth");
    });

    it("should redirect to /minha-conta/dashboard when buyer tries to access", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "buyer" });

      render(
        <ProducerRoute>
          <ProtectedContent />
        </ProducerRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/minha-conta/dashboard");
    });

    it("should allow admin to access producer routes", () => {
      mockAuth({ isAuthenticated: true, isAuthLoading: false, activeRole: "admin" });

      render(
        <ProducerRoute>
          <ProtectedContent />
        </ProducerRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should show loading spinner when auth is loading", () => {
      mockAuth({ isAuthenticated: false, isAuthLoading: true });

      render(
        <ProducerRoute>
          <ProtectedContent />
        </ProducerRoute>
      );

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });
  });

  describe("MarketplaceRoute", () => {
    it("should render children when user is admin", () => {
      vi.mocked(UsePermissions.usePermissions).mockReturnValue(
        createMockPermissions("admin")
      );

      render(
        <MarketplaceRoute>
          <ProtectedContent />
        </MarketplaceRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should render children when user is owner", () => {
      vi.mocked(UsePermissions.usePermissions).mockReturnValue(
        createMockPermissions("owner")
      );

      render(
        <MarketplaceRoute>
          <ProtectedContent />
        </MarketplaceRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should show EmBreve page when user is regular user", () => {
      vi.mocked(UsePermissions.usePermissions).mockReturnValue(
        createMockPermissions("user")
      );

      render(
        <MarketplaceRoute>
          <ProtectedContent />
        </MarketplaceRoute>
      );

      expect(screen.getByTestId("em-breve")).toBeInTheDocument();
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("should show EmBreve page when user is seller", () => {
      vi.mocked(UsePermissions.usePermissions).mockReturnValue(
        createMockPermissions("seller")
      );

      render(
        <MarketplaceRoute>
          <ProtectedContent />
        </MarketplaceRoute>
      );

      expect(screen.getByTestId("em-breve")).toBeInTheDocument();
    });

    it("should show loading spinner when permissions are loading", () => {
      vi.mocked(UsePermissions.usePermissions).mockReturnValue(
        createMockPermissions("user", { isLoading: true })
      );

      render(
        <MarketplaceRoute>
          <ProtectedContent />
        </MarketplaceRoute>
      );

      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });
});
