/**
 * @file _shared.tsx
 * @description Shared utilities and mocks for layouts tests
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { vi } from "vitest";
import React from "react";

// ============================================================================
// MOCK AUTH
// ============================================================================

export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};

export const mockAuthState = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  logout: vi.fn(),
  isProducer: true,
  canSwitchToProducer: false,
  switchToProducer: vi.fn(),
  isSwitching: false,
  isLoggingOut: false,
};

// Mock useUnifiedAuth
vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: () => mockAuthState,
}));

// ============================================================================
// MOCK NAVIGATION
// ============================================================================

export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: "/dashboard",
  search: "",
  hash: "",
  state: null,
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

// ============================================================================
// MOCK NAVIGATION MODULE
// ============================================================================

export const mockNavigation = {
  state: {
    sidebarState: "expanded" as const,
  },
  currentWidth: 256,
  setMobileOpen: vi.fn(),
  cycleSidebarState: vi.fn(),
};

vi.mock("@/modules/navigation", () => ({
  useNavigation: () => mockNavigation,
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

// ============================================================================
// MOCK HOOKS
// ============================================================================

export const mockScrollShadow = {
  sentinelRef: { current: null },
  scrolled: false,
};

vi.mock("@/hooks/useScrollShadow", () => ({
  useScrollShadow: () => mockScrollShadow,
}));
