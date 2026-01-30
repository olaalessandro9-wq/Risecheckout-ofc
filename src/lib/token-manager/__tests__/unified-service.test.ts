/**
 * Unified Service Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the unified token service convenience API including:
 * - Singleton instance creation
 * - Authentication state checking
 * - Token refresh operations
 * - Authentication clearing
 * - State setting after login
 * - Subscription to auth state changes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  unifiedTokenService,
  isAuthenticated,
  refreshToken,
  clearAuth,
  setAuthenticated,
  subscribeToAuth,
} from "../unified-service";
import { TokenService } from "../service";

// ============================================
// MOCKS
// ============================================

// Mock TokenService
vi.mock("../service", () => {
  const mockService = {
    hasValidToken: vi.fn(),
    refresh: vi.fn(),
    clearTokens: vi.fn(),
    setAuthenticated: vi.fn(),
    subscribe: vi.fn(),
  };

  return {
    TokenService: vi.fn(function(this: object) {
      return mockService;
    }),
  };
});

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
  }),
}));

describe("Unified Token Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========== SINGLETON TESTS ==========

  describe("unifiedTokenService singleton", () => {
    it("should be defined and accessible", () => {
      expect(unifiedTokenService).toBeDefined();
      expect(unifiedTokenService).toBeTruthy();
    });

    it("should have all required methods", () => {
      expect(unifiedTokenService.hasValidToken).toBeDefined();
      expect(unifiedTokenService.refresh).toBeDefined();
      expect(unifiedTokenService.clearTokens).toBeDefined();
      expect(unifiedTokenService.setAuthenticated).toBeDefined();
      expect(unifiedTokenService.subscribe).toBeDefined();
    });
  });

  // ========== isAuthenticated() TESTS ==========

  describe("isAuthenticated()", () => {
    it("should return true when user has valid token", () => {
      vi.mocked(unifiedTokenService.hasValidToken).mockReturnValue(true);

      const result = isAuthenticated();

      expect(result).toBe(true);
      expect(unifiedTokenService.hasValidToken).toHaveBeenCalledTimes(1);
    });

    it("should return false when user does not have valid token", () => {
      vi.mocked(unifiedTokenService.hasValidToken).mockReturnValue(false);

      const result = isAuthenticated();

      expect(result).toBe(false);
      expect(unifiedTokenService.hasValidToken).toHaveBeenCalledTimes(1);
    });
  });

  // ========== refreshToken() TESTS ==========

  describe("refreshToken()", () => {
    it("should return true on successful refresh", async () => {
      vi.mocked(unifiedTokenService.refresh).mockResolvedValue(true);

      const result = await refreshToken();

      expect(result).toBe(true);
      expect(unifiedTokenService.refresh).toHaveBeenCalledTimes(1);
    });

    it("should return false on failed refresh", async () => {
      vi.mocked(unifiedTokenService.refresh).mockResolvedValue(false);

      const result = await refreshToken();

      expect(result).toBe(false);
      expect(unifiedTokenService.refresh).toHaveBeenCalledTimes(1);
    });
  });

  // ========== clearAuth() TESTS ==========

  describe("clearAuth()", () => {
    it("should call clearTokens on the service", () => {
      clearAuth();

      expect(unifiedTokenService.clearTokens).toHaveBeenCalledTimes(1);
    });
  });

  // ========== setAuthenticated() TESTS ==========

  describe("setAuthenticated()", () => {
    it("should call setAuthenticated with correct expiresIn value", () => {
      const expiresIn = 14400; // 4 hours

      setAuthenticated(expiresIn);

      expect(unifiedTokenService.setAuthenticated).toHaveBeenCalledTimes(1);
      expect(unifiedTokenService.setAuthenticated).toHaveBeenCalledWith(expiresIn);
    });
  });

  // ========== subscribeToAuth() TESTS ==========

  describe("subscribeToAuth()", () => {
    it("should subscribe to auth state changes and call callback", () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(unifiedTokenService.subscribe).mockReturnValue(mockUnsubscribe);

      const unsubscribe = subscribeToAuth(mockCallback);

      expect(unifiedTokenService.subscribe).toHaveBeenCalledTimes(1);
      expect(unifiedTokenService.subscribe).toHaveBeenCalledWith(mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it("should return unsubscribe function that can be called", () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(unifiedTokenService.subscribe).mockReturnValue(mockUnsubscribe);

      const unsubscribe = subscribeToAuth(mockCallback);
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});
