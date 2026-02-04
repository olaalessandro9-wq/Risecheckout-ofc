/**
 * Auth Type-Safe Mock Factories
 * 
 * @module test/factories/auth
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { vi } from "vitest";
import type { UnifiedUser, UnifiedAuthState, AppRole } from "@/hooks/useUnifiedAuth";
import type { Permissions } from "@/hooks/usePermissions";

export function createMockUnifiedUser(
  overrides: Partial<UnifiedUser> = {}
): UnifiedUser {
  return {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    timezone: "America/Sao_Paulo",
    ...overrides,
  };
}

export function createMockUnifiedAuthState(
  overrides: Partial<UnifiedAuthState> = {}
): UnifiedAuthState {
  return {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    roles: [],
    activeRole: null,
    expiresIn: null,
    ...overrides,
  };
}

export function createMockPermissions(
  role: "owner" | "admin" | "user" | "seller" = "user",
  overrides: Partial<Permissions> = {}
): Permissions {
  return {
    role,
    isLoading: false,
    error: null,
    canHaveAffiliates: role === "owner",
    canManageProducts: true,
    canAccessMarketplace: true,
    canBecomeAffiliate: role !== "owner",
    canAccessAdminPanel: role === "owner" || role === "admin",
    canViewSecurityLogs: role === "owner" || role === "admin",
    canManageUsers: role === "owner" || role === "admin",
    canAccessMembersArea: role === "owner" || role === "admin",
    ...overrides,
  };
}

export function createMockThemeReturn(theme: "light" | "dark" = "light") {
  return {
    theme,
    setTheme: vi.fn() as (theme: "light" | "dark") => void,
  };
}
