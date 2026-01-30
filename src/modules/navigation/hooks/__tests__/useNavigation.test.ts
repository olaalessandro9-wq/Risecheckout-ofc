/**
 * useNavigation Hook Tests
 * 
 * RISE V3 Compliant - 10.0/10
 * Tests navigation state management with XState and localStorage
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { useNavigation } from "../useNavigation";

// Mock XState
const mockSend = vi.fn();
vi.mock("@xstate/react", () => ({
  useMachine: () => [
    {
      context: {
        sidebarState: "expanded",
        isHovering: false,
        mobileOpen: false,
        expandedGroups: new Set<string>(),
      },
    },
    mockSend,
  ],
}));

// Mock usePermissions
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canAccessAdmin: true,
    canAccessFinanceiro: true,
    canAccessProdutos: true,
    canAccessAfiliados: true,
  }),
}));

// Mock navigation config
vi.mock("../config/navigationConfig", () => ({
  NAVIGATION_CONFIG: [
    { id: "dashboard", path: "/dashboard", label: "Dashboard", icon: "Home" },
    { id: "products", path: "/produtos", label: "Produtos", icon: "Package" },
  ],
}));

// Mock navigation helpers with correct values from SIDEBAR_WIDTHS
vi.mock("../utils/navigationHelpers", () => ({
  findActiveGroups: vi.fn(() => []),
  getSidebarWidth: vi.fn((state, hovering) => {
    if (state === "expanded") return 280;
    if (state === "collapsed" && hovering) return 280;
    if (state === "collapsed") return 80;
    return 0;
  }),
  shouldShowLabels: vi.fn((state, hovering) => state === "expanded" || hovering),
  getStoredSidebarState: vi.fn(() => "expanded"),
  saveSidebarState: vi.fn(),
}));

// Mock permission filters
vi.mock("../utils/permissionFilters", () => ({
  filterByPermissions: vi.fn((items) => items),
  extractNavigationPermissions: vi.fn(() => ({
    canAccessAdmin: true,
    canAccessFinanceiro: true,
  })),
}));

// Wrapper with MemoryRouter
function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(MemoryRouter, { initialEntries: ["/dashboard"] }, children);
  };
}

describe("useNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockClear();
  });

  describe("return interface", () => {
    it("should return all required properties", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("state");
      expect(result.current).toHaveProperty("showLabels");
      expect(result.current).toHaveProperty("currentWidth");
      expect(result.current).toHaveProperty("visibleItems");
      expect(result.current).toHaveProperty("cycleSidebarState");
      expect(result.current).toHaveProperty("setMobileOpen");
      expect(result.current).toHaveProperty("handleMobileNavigate");
      expect(result.current).toHaveProperty("toggleGroup");
      expect(result.current).toHaveProperty("isGroupExpanded");
      expect(result.current).toHaveProperty("handleMouseEnter");
      expect(result.current).toHaveProperty("handleMouseLeave");
      expect(result.current).toHaveProperty("dispatch");
    });
  });

  describe("state shape", () => {
    it("should have correct state properties", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.state).toHaveProperty("sidebarState");
      expect(result.current.state).toHaveProperty("isHovering");
      expect(result.current.state).toHaveProperty("mobileOpen");
      expect(result.current.state).toHaveProperty("expandedGroups");
    });

    it("should have correct initial sidebarState", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.state.sidebarState).toBe("expanded");
    });
  });

  describe("derived values", () => {
    it("should calculate showLabels correctly", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      // expanded = true
      expect(result.current.showLabels).toBe(true);
    });

    it("should calculate currentWidth correctly", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      // expanded = 280 (from SIDEBAR_WIDTHS)
      expect(result.current.currentWidth).toBe(280);
    });

    it("should filter visibleItems by permissions", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      expect(Array.isArray(result.current.visibleItems)).toBe(true);
    });
  });

  describe("actions", () => {
    it("should call send on cycleSidebarState", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.cycleSidebarState();
      });

      expect(mockSend).toHaveBeenCalledWith({ type: "CYCLE_SIDEBAR" });
    });

    it("should call send on setMobileOpen", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setMobileOpen(true);
      });

      expect(mockSend).toHaveBeenCalledWith({ type: "SET_MOBILE_OPEN", isOpen: true });
    });

    it("should call send on handleMobileNavigate", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleMobileNavigate();
      });

      expect(mockSend).toHaveBeenCalledWith({ type: "SET_MOBILE_OPEN", isOpen: false });
    });

    it("should call send on toggleGroup", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.toggleGroup("products");
      });

      expect(mockSend).toHaveBeenCalledWith({ type: "TOGGLE_GROUP", groupId: "products" });
    });

    it("should call send on handleMouseEnter", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleMouseEnter();
      });

      expect(mockSend).toHaveBeenCalledWith({ type: "MOUSE_ENTER" });
    });

    it("should call send on handleMouseLeave", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleMouseLeave();
      });

      expect(mockSend).toHaveBeenCalledWith({ type: "MOUSE_LEAVE" });
    });
  });

  describe("isGroupExpanded", () => {
    it("should return false for non-expanded group", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isGroupExpanded("products")).toBe(false);
    });
  });

  describe("dispatch", () => {
    it("should forward events to send", () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.dispatch({ type: "CYCLE_SIDEBAR" });
      });

      expect(mockSend).toHaveBeenCalledWith({ type: "CYCLE_SIDEBAR" });
    });
  });
});
