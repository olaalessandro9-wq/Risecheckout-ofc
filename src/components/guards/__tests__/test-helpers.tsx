/**
 * Guards Test Helpers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Shared test utilities for guard components.
 * Centralizes mock factories and common test setup.
 * 
 * @module components/guards/__tests__/test-helpers
 */

import React from "react";
import type { AppRole, Permissions } from "@/hooks/usePermissions";
import type { UnifiedUser } from "@/hooks/useUnifiedAuth";

export function createMockUser(overrides: Partial<UnifiedUser> = {}): UnifiedUser {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    timezone: "America/Sao_Paulo",
    ...overrides,
  };
}

export function createMockAuthState(config: {
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
    isLoggingIn: false,
    isLoggingOut: false,
    isSwitching: false,
    activeRole: activeRole as AppRole | "buyer" | null,
    user: config.isAuthenticated ? createMockUser() : null,
    roles: [] as AppRole[],
    expiresIn: null,
    isProducer: activeRole !== "buyer",
    isBuyer: activeRole === "buyer",
    canSwitchToProducer: true,
    canSwitchToBuyer: true,
    switchToProducer: async () => ({ success: true }),
    switchToBuyer: async () => ({ success: true }),
    logout: async () => {},
    refreshSession: async () => {},
    updateUserMetadata: async () => {},
    login: async () => ({ success: true }),
    switchContext: async () => ({ success: true }),
    refresh: async () => ({ valid: true }),
    invalidate: () => {},
    clearError: () => {},
    setActiveRole: () => {},
    loginWithMagicLink: async () => {},
    loginError: "",
    mfaSetupRequired: false,
  };
}

export function createMockPermissions(
  role: AppRole,
  overrides: Partial<Permissions> = {}
): Permissions {
  const basePermissions: Permissions = {
    role,
    canHaveAffiliates: role === "owner",
    canManageProducts: true,
    canAccessMarketplace: true,
    canBecomeAffiliate: role !== "owner",
    canAccessAdminPanel: role === "owner" || role === "admin",
    canViewSecurityLogs: role === "owner" || role === "admin",
    canManageUsers: role === "owner" || role === "admin",
    canAccessMembersArea: role === "owner" || role === "admin",
    isLoading: false,
    error: null,
  };

  return {
    ...basePermissions,
    ...overrides,
  };
}

export const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;
