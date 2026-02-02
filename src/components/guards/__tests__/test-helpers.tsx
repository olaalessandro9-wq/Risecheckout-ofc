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
    activeRole: activeRole as AppRole | "buyer" | null,
    user: config.isAuthenticated ? createMockUser() : null,
    roles: [] as AppRole[],
    expiresIn: null,
    isProducer: activeRole !== "buyer",
    isBuyer: activeRole === "buyer",
    canSwitchToProducer: true,
    canSwitchToBuyer: true,
    switchToProducer: async () => {},
    switchToBuyer: async () => {},
    logout: async () => {},
    refreshSession: async () => {},
    updateUserMetadata: async () => {},
  };
}

export function createMockPermissions(
  role: AppRole,
  overrides: Partial<Permissions> = {}
): Permissions {
  const basePermissions: Permissions = {
    role,
    canAccessAdmin: role === "admin" || role === "owner",
    canManageUsers: role === "admin" || role === "owner",
    canManageProducts: role !== "buyer",
    canManageOrders: role !== "buyer",
    canAccessFinancial: role !== "buyer",
    canHaveAffiliates: role === "seller" || role === "admin" || role === "owner",
    canAccessMarketplace: role === "admin" || role === "owner",
    canManageGateways: role === "owner",
    isLoading: false,
    isError: false,
    error: null,
    refetch: async () => ({ data: undefined }),
  };

  return {
    ...basePermissions,
    ...overrides,
  };
}

export const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;
