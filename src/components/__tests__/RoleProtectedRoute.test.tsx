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
import type { AppRole, Permissions } from "@/hooks/usePermissions";
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

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
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
  isLoading: boolean;
  user: UnifiedUser | null;
}) {
  return {
    user: config.user,
    isLoading: config.isLoading,
    isAuthenticated: !!config.user,
    isAuthLoading: config.isLoading,
    isSyncing: false,
    isRefetching: false,
    roles: [] as AppRole[],
    activeRole: null as AppRole | null,
    expiresIn: null,
    isProducer: false,
    isBuyer: false,
    canSwitchToProducer: false,
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
    mfaSetupRequired: false,
  };
}

function createMockPermissions(
  role: AppRole,
  overrides: Partial<Permissions> = {}
): Permissions {
  return {
    role,
    isLoading: false,
    error: null,
    canHaveAffiliates: role === "owner",
    canManageUsers: role === "owner",
    canManageProducts: true,
    canAccessMarketplace: true,
    canBecomeAffiliate: true,
    canAccessAdminPanel: role === "owner" || role === "admin",
    canViewSecurityLogs: role === "owner",
    canAccessMembersArea: role === "owner" || role === "admin",
    ...overrides,
  };
}

// ============================================================================
// TEST HELPERS
// ============================================================================

function mockAuth(isLoading: boolean, user: UnifiedUser | null) {
  const mockReturn = createMockAuthState({ isLoading, user });
  vi.mocked(UseUnifiedAuth.useUnifiedAuth).mockReturnValue(mockReturn);
}

function mockPermissions(role: AppRole, overrides: Partial<Permissions> = {}) {
  vi.mocked(UsePermissions.usePermissions).mockReturnValue(
    createMockPermissions(role, overrides)
  );
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

  describe("Loading States", () => {
    it("should show loading spinner when auth is loading", () => {
      mockAuth(true, null);
      mockPermissions("user");
      render(<RoleProtectedRoute><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("should show loading spinner when permissions are loading", () => {
      mockAuth(false, createMockUser());
      vi.mocked(UsePermissions.usePermissions).mockReturnValue(
        createMockPermissions("user", { isLoading: true })
      );
      render(<RoleProtectedRoute><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("Authentication", () => {
    it("should redirect to /auth when user is not authenticated", () => {
      mockAuth(false, null);
      mockPermissions("user");
      render(<RoleProtectedRoute><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/auth");
    });

    it("should render children when user is authenticated", () => {
      mockAuth(false, createMockUser());
      mockPermissions("user");
      render(<RoleProtectedRoute><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

  describe("Role-Based Access", () => {
    it("should allow owner to access owner-only routes", () => {
      mockAuth(false, createMockUser({ email: "owner@example.com" }));
      mockPermissions("owner");
      render(<RoleProtectedRoute requiredRole="owner"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should allow owner to access admin routes", () => {
      mockAuth(false, createMockUser({ email: "owner@example.com" }));
      mockPermissions("owner");
      render(<RoleProtectedRoute requiredRole="admin"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should allow admin to access admin routes", () => {
      mockAuth(false, createMockUser({ email: "admin@example.com" }));
      mockPermissions("admin");
      render(<RoleProtectedRoute requiredRole="admin"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should deny user access to admin routes", () => {
      mockAuth(false, createMockUser({ email: "user@example.com" }));
      mockPermissions("user");
      render(<RoleProtectedRoute requiredRole="admin"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard");
    });

    it("should deny seller access to owner routes", () => {
      mockAuth(false, createMockUser({ email: "seller@example.com" }));
      mockPermissions("seller");
      render(<RoleProtectedRoute requiredRole="owner"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard");
    });
  });

  describe("Permission-Based Access", () => {
    it("should allow access when user has required permission", () => {
      mockAuth(false, createMockUser({ email: "owner@example.com" }));
      mockPermissions("owner", { canHaveAffiliates: true });
      render(<RoleProtectedRoute requiredPermission="canHaveAffiliates"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should deny access when user lacks required permission", () => {
      mockAuth(false, createMockUser({ email: "user@example.com" }));
      mockPermissions("user", { canHaveAffiliates: false });
      render(<RoleProtectedRoute requiredPermission="canHaveAffiliates"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard");
    });

    it("should check both role and permission when both are specified", () => {
      mockAuth(false, createMockUser({ email: "admin@example.com" }));
      mockPermissions("admin", { canManageUsers: true });
      render(<RoleProtectedRoute requiredRole="admin" requiredPermission="canManageUsers"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should deny access if role matches but permission is missing", () => {
      mockAuth(false, createMockUser({ email: "admin@example.com" }));
      mockPermissions("admin", { canManageUsers: false });
      render(<RoleProtectedRoute requiredRole="admin" requiredPermission="canManageUsers"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });
  });

  describe("Custom Fallback", () => {
    it("should redirect to custom fallback path when access is denied", () => {
      mockAuth(false, createMockUser({ email: "user@example.com" }));
      mockPermissions("user");
      render(<RoleProtectedRoute requiredRole="admin" fallbackPath="/unauthorized"><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/unauthorized");
    });
  });

  describe("Access Denied Message", () => {
    it("should show access denied message when showAccessDenied is true", () => {
      mockAuth(false, createMockUser({ email: "user@example.com" }));
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
      mockAuth(false, createMockUser({ email: "user@example.com" }));
      mockPermissions("user");
      render(
        <RoleProtectedRoute requiredRole="admin" showAccessDenied>
          <ProtectedContent />
        </RoleProtectedRoute>
      );
      expect(screen.getByText("🔒")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing requiredRole and requiredPermission", () => {
      mockAuth(false, createMockUser({ email: "user@example.com" }));
      mockPermissions("user");
      render(<RoleProtectedRoute><ProtectedContent /></RoleProtectedRoute>);
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should handle role hierarchy correctly", () => {
      mockAuth(false, createMockUser({ email: "user@example.com" }));
      mockPermissions("user");
      render(
        <RoleProtectedRoute requiredRole="seller">
          <ProtectedContent />
        </RoleProtectedRoute>
      );
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });
});
