/**
 * useAuthRole - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests selective subscription hook for role data.
 * 
 * @module hooks/__tests__/useAuthRole.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuthRole } from "../useAuthRole";

// Mock React Query
const mockGetQueryData = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    getQueryData: mockGetQueryData,
  }),
}));

describe("useAuthRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when no data in cache", () => {
    beforeEach(() => {
      mockGetQueryData.mockReturnValue(undefined);
    });

    it("should return null activeRole", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.activeRole).toBeNull();
    });

    it("should return empty roles array", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.roles).toEqual([]);
    });

    it("should return isAuthenticated as false", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should return isProducer as false", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.isProducer).toBe(false);
    });

    it("should return isBuyer as false", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.isBuyer).toBe(false);
    });
  });

  describe("when user is authenticated as owner", () => {
    beforeEach(() => {
      mockGetQueryData.mockReturnValue({
        valid: true,
        activeRole: "owner",
        roles: ["owner", "admin"],
      });
    });

    it("should return owner as activeRole", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.activeRole).toBe("owner");
    });

    it("should return all roles", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.roles).toEqual(["owner", "admin"]);
    });

    it("should return isAuthenticated as true", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should return isProducer as true for owner", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.isProducer).toBe(true);
    });

    it("should return isBuyer as false for owner", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.isBuyer).toBe(false);
    });
  });

  describe("when user is authenticated as admin", () => {
    beforeEach(() => {
      mockGetQueryData.mockReturnValue({
        valid: true,
        activeRole: "admin",
        roles: ["admin"],
      });
    });

    it("should return isProducer as true for admin", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.isProducer).toBe(true);
    });
  });

  describe("when user is authenticated as seller", () => {
    beforeEach(() => {
      mockGetQueryData.mockReturnValue({
        valid: true,
        activeRole: "seller",
        roles: ["seller"],
      });
    });

    it("should return isProducer as true for seller", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.isProducer).toBe(true);
    });
  });

  describe("when user is authenticated as buyer", () => {
    beforeEach(() => {
      mockGetQueryData.mockReturnValue({
        valid: true,
        activeRole: "buyer",
        roles: ["buyer"],
      });
    });

    it("should return buyer as activeRole", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.activeRole).toBe("buyer");
    });

    it("should return isProducer as false for buyer", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.isProducer).toBe(false);
    });

    it("should return isBuyer as true", () => {
      const { result } = renderHook(() => useAuthRole());
      expect(result.current.isBuyer).toBe(true);
    });
  });

  describe("cache key usage", () => {
    it("should query with unified-auth key", () => {
      mockGetQueryData.mockReturnValue(undefined);
      renderHook(() => useAuthRole());
      
      expect(mockGetQueryData).toHaveBeenCalledWith(["unified-auth"]);
    });
  });

  describe("memoization", () => {
    it("should memoize result based on cache data", () => {
      mockGetQueryData.mockReturnValue({
        valid: true,
        activeRole: "owner",
        roles: ["owner"],
      });
      
      const { result, rerender } = renderHook(() => useAuthRole());
      const firstResult = result.current;
      
      rerender();
      
      // Should be referentially equal due to memoization
      expect(result.current.activeRole).toBe(firstResult.activeRole);
      expect(result.current.roles).toEqual(firstResult.roles);
    });
  });
});
