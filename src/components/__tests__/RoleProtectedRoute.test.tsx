/**
 * @file RoleProtectedRoute.test.tsx
 * @description Tests for RoleProtectedRoute component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { RoleProtectedRoute } from "../RoleProtectedRoute";
import * as ReactRouterDOM from "react-router-dom";
import * as UseUnifiedAuth from "@/hooks/useUnifiedAuth";
import * as UsePermissions from "@/hooks/usePermissions";
import type { AppRole } from "@/hooks/usePermissions";
import type { UnifiedAuthState } from "@/hooks/useUnifiedAuth";
import type { Permissions } from "@/hooks/usePermissions";

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

// Mock usePermissions
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// ============================================================================
// TEST HELPERS
// ============================================================================

function mockAuth(isLoading: boolean, user: { id: string; email: string } | null) {
  const mockReturn: Partial<UnifiedAuthState> = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    switchContext: vi.fn(),
    refreshSession: vi.fn(),
  };
  vi.mocked(UseUnifiedAuth.useUnifiedAuth).mockReturnValue(mockReturn as UnifiedAuthState);
}

function mockPermissions(role: AppRole, permissions: Record<string, boolean> = {}) {
  vi.mocked(UsePermissions.usePermissions).mockReturnValue({
    role,
    isLoading: false,
    error: null,
    canHaveAffiliates: permissions.canHaveAffiliates ?? false,
    canManageUsers: permissions.canManageUsers ?? false,
    canViewAnalytics: permissions.canViewAnalytics ?? false,
    canManageProducts: permissions.canManageProducts ?? false,
    ...permissions,
  } as Permissions);
}

const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;

// ============================================================================
// TESTS
// ============================================================================

describe("RoleProtectedRoute", () => {
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
      mockAuth(true, null);
      mockPermissions("user");
      render(<RoleProtectedRoute><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
    it("should show loading spinner when permissions are loading", () => {
      mockAuth(false, { id: "1", email: "test@example.com" });
      vi.mocked(UsePermissions.usePermissions).mockReturnValue({
        role: "user", isLoading: true, error: null,
      } as Permissions);
      render(<RoleProtectedRoute><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================
  describe("Authentication", () => {
    it("should redirect to /auth when user is not authenticated", () => {
      mockAuth(false, null);
      mockPermissions("user");

      render(
        <RoleProtectedRoute>
          <ProtectedContent />
        </RoleProtectedRoute>
      );

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/auth");
    });

    it("should render children when user is authenticated", () => {
      mockAuth(false, { id: "1", email: "test@example.com" });
      mockPermissions("user");

      render(
        <RoleProtectedRoute>
          <ProtectedContent />
        </RoleProtectedRoute>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ROLE-BASED ACCESS
  // ==========================================================================
  describe("Role-Based Access", () => {
    it("should allow owner to access owner-only routes", () => {
      mockAuth(false, { id: "1", email: "owner@example.com" });
      mockPermissions("owner");
      render(<RoleProtectedRoute requiredRole="owner"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
    it("should allow owner to access admin routes", () => {
      mockAuth(false, { id: "1", email: "owner@example.com" });
      mockPermissions("owner");
      render(<RoleProtectedRoute requiredRole="admin"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
    it("should allow admin to access admin routes", () => {
      mockAuth(false, { id: "1", email: "admin@example.com" });
      mockPermissions("admin");
      render(<RoleProtectedRoute requiredRole="admin"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should deny user access to admin routes", () => {
      mockAuth(false, { id: "1", email: "user@example.com" });
      mockPermissions("user");
      render(<RoleProtectedRoute requiredRole="admin"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard");
    });
    it("should deny seller access to owner routes", () => {
      mockAuth(false, { id: "1", email: "seller@example.com" });
      mockPermissions("seller");
      render(<RoleProtectedRoute requiredRole="owner"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard");
    });
  });

  // ==========================================================================
  // PERMISSION-BASED ACCESS
  // ==========================================================================
  describe("Permission-Based Access", () => {
    it("should allow access when user has required permission", () => {
      mockAuth(false, { id: "1", email: "owner@example.com" });
      mockPermissions("owner", { canHaveAffiliates: true });
      render(<RoleProtectedRoute requiredPermission="canHaveAffiliates"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
    it("should deny access when user lacks required permission", () => {
      mockAuth(false, { id: "1", email: "user@example.com" });
      mockPermissions("user", { canHaveAffiliates: false });
      render(<RoleProtectedRoute requiredPermission="canHaveAffiliates"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard");
    });
    it("should check both role and permission when both are specified", () => {
      mockAuth(false, { id: "1", email: "admin@example.com" });
      mockPermissions("admin", { canManageUsers: true });
      render(<RoleProtectedRoute requiredRole="admin" requiredPermission="canManageUsers"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
    it("should deny access if role matches but permission is missing", () => {
      mockAuth(false, { id: "1", email: "admin@example.com" });
      mockPermissions("admin", { canManageUsers: false });
      render(<RoleProtectedRoute requiredRole="admin" requiredPermission="canManageUsers"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // CUSTOM FALLBACK
  // ==========================================================================
  describe("Custom Fallback", () => {
    it("should redirect to custom fallback path when access is denied", () => {
      mockAuth(false, { id: "1", email: "user@example.com" });
      mockPermissions("user");
      render(<RoleProtectedRoute requiredRole="admin" fallbackPath="/unauthorized"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/unauthorized");
    });
  });

  // ==========================================================================
  // ACCESS DENIED MESSAGE
  // ==========================================================================
  describe("Access Denied Message", () => {
    it("should show access denied message when showAccessDenied is true", () => {
      mockAuth(false, { id: "1", email: "user@example.com" });
      mockPermissions("user");

      render(
        <RoleProtectedRoute requiredRole="admin" showAccessDenied>
          <ProtectedContent />
        </RoleProtectedRoute>
      );

      expect(screen.getByText("Acesso Restrito")).toBeInTheDocument();
      expect(screen.getByText(/Você não tem permissão para acessar esta página/)).toBeInTheDocument();
      expect(screen.queryByTestId("navigate-to")).not.toBeInTheDocument();
    });

    it("should show lock emoji in access denied message", () => {
      mockAuth(false, { id: "1", email: "user@example.com" });
      mockPermissions("user");

      render(
        <RoleProtectedRoute requiredRole="admin" showAccessDenied>
          <ProtectedContent />
        </RoleProtectedRoute>
      );

      expect(screen.getByText("🔒")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe("Edge Cases", () => {
    it("should handle missing requiredRole and requiredPermission", () => {
      mockAuth(false, { id: "1", email: "user@example.com" });
      mockPermissions("user");

      render(
        <RoleProtectedRoute>
          <ProtectedContent />
        </RoleProtectedRoute>
      );

      // Should allow access when no requirements are specified
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should handle role hierarchy correctly", () => {
      mockAuth(false, { id: "1", email: "user@example.com" });
      mockPermissions("user");

      render(
        <RoleProtectedRoute requiredRole="seller">
          <ProtectedContent />
        </RoleProtectedRoute>
      );

      // user (priority 3) should have access to seller (priority 4) routes
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });
});
