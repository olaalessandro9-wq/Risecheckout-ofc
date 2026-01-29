/**
 * usePermissions Hook Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  usePermissions,
  useHasMinRole,
  useCanHaveAffiliates,
  type AppRole,
} from "./usePermissions";

vi.mock("@/hooks/useAuthRole", () => ({
  useAuthRole: vi.fn(() => ({ 
    activeRole: "user" as AppRole,
    roles: [],
    isAuthenticated: true,
    isProducer: true,
    isBuyer: false,
  })),
}));

import { useAuthRole } from "@/hooks/useAuthRole";

const createMockAuthRole = (role: AppRole) => ({
  activeRole: role,
  roles: [role],
  isAuthenticated: true,
  isProducer: true,
  isBuyer: false,
});

describe("usePermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have canHaveAffiliates=true for owner", () => {
    vi.mocked(useAuthRole).mockReturnValue(createMockAuthRole("owner"));
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canHaveAffiliates).toBe(true);
  });

  it("should have canHaveAffiliates=false for user", () => {
    vi.mocked(useAuthRole).mockReturnValue(createMockAuthRole("user"));
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canHaveAffiliates).toBe(false);
  });

  it("should have canAccessAdminPanel=true for admin", () => {
    vi.mocked(useAuthRole).mockReturnValue(createMockAuthRole("admin"));
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccessAdminPanel).toBe(true);
  });
});

describe("useHasMinRole", () => {
  it("should return true for owner >= user", () => {
    vi.mocked(useAuthRole).mockReturnValue(createMockAuthRole("owner"));
    const { result } = renderHook(() => useHasMinRole("user"));
    expect(result.current).toBe(true);
  });
});

describe("useCanHaveAffiliates", () => {
  it("should return true for owner", () => {
    vi.mocked(useAuthRole).mockReturnValue(createMockAuthRole("owner"));
    const { result } = renderHook(() => useCanHaveAffiliates());
    expect(result.current.canHaveAffiliates).toBe(true);
  });
});
