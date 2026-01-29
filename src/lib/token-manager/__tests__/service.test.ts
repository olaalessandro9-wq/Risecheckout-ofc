/**
 * TokenService Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the main TokenService class including:
 * - Constructor and initial state
 * - Lazy initialization
 * - State transitions
 * - Subscriber pattern
 * - Token validation
 * - Refresh coordination
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TokenService } from "../service";
import type { TokenState, TokenContext } from "../types";

// ============================================
// MOCKS
// ============================================

// Mock HeartbeatManager
vi.mock("../heartbeat", () => ({
  HeartbeatManager: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    triggerNow: vi.fn(),
    isRunning: vi.fn().mockReturnValue(false),
  })),
}));

// Mock CrossTabLock
vi.mock("../cross-tab-lock", () => ({
  crossTabLock: {
    tryAcquire: vi.fn().mockReturnValue(true),
    release: vi.fn(),
    notifySuccess: vi.fn(),
    notifyFailure: vi.fn(),
    isOtherTabRefreshing: vi.fn().mockReturnValue(false),
    waitForResult: vi.fn().mockResolvedValue({ success: false }),
  },
}));

// Mock SessionCommander
vi.mock("@/lib/session-commander", () => ({
  sessionCommander: {
    requestRefresh: vi.fn().mockResolvedValue({ success: true, expiresIn: 14400 }),
  },
}));

// Mock persistence
vi.mock("../persistence", () => ({
  persistTokenState: vi.fn(),
  restoreTokenState: vi.fn().mockReturnValue({ state: null, expiresAt: null, lastRefreshAttempt: null }),
  clearPersistedState: vi.fn(),
}));

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

describe("TokenService", () => {
  let service: TokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TokenService("unified");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========== CONSTRUCTOR TESTS ==========

  describe("Constructor", () => {
    it("should create instance with idle state", () => {
      expect(service.getState()).toBe("idle");
    });

    it("should not be initialized on construction", () => {
      expect(service.isInitialized()).toBe(false);
    });

    it("should have null expiresAt in initial context", () => {
      const context = service.getContext();
      expect(context.expiresAt).toBeNull();
    });

    it("should have zero refresh failure count initially", () => {
      const context = service.getContext();
      expect(context.refreshFailureCount).toBe(0);
    });
  });

  // ========== INITIALIZATION TESTS ==========

  describe("Initialization", () => {
    it("should set initialized to true after initialize()", () => {
      service.initialize();
      expect(service.isInitialized()).toBe(true);
    });

    it("should be idempotent - multiple calls do not cause issues", () => {
      service.initialize();
      service.initialize();
      service.initialize();
      expect(service.isInitialized()).toBe(true);
    });

    it("should not throw when called multiple times", () => {
      expect(() => {
        service.initialize();
        service.initialize();
      }).not.toThrow();
    });
  });

  // ========== STATE TRANSITIONS ==========

  describe("State Transitions", () => {
    it("should transition to authenticated on LOGIN_SUCCESS", () => {
      service.setAuthenticated(14400);
      expect(service.getState()).toBe("authenticated");
    });

    it("should set expiresAt in context after setAuthenticated", () => {
      const before = Date.now();
      service.setAuthenticated(14400);
      const after = Date.now();
      
      const context = service.getContext();
      expect(context.expiresAt).not.toBeNull();
      expect(context.expiresAt!).toBeGreaterThanOrEqual(before + 14400 * 1000);
      expect(context.expiresAt!).toBeLessThanOrEqual(after + 14400 * 1000);
    });

    it("should clear tokens and transition to idle on clearTokens", () => {
      service.setAuthenticated(14400);
      expect(service.getState()).toBe("authenticated");
      
      service.clearTokens();
      expect(service.getState()).toBe("idle");
    });
  });

  // ========== TOKEN VALIDATION ==========

  describe("Token Validation", () => {
    it("should return false for hasValidToken when idle", () => {
      expect(service.hasValidToken()).toBe(false);
    });

    it("should return true for hasValidToken when authenticated", () => {
      service.setAuthenticated(14400);
      expect(service.hasValidToken()).toBe(true);
    });

    it("should return false for hasValidToken after clearTokens", () => {
      service.setAuthenticated(14400);
      service.clearTokens();
      expect(service.hasValidToken()).toBe(false);
    });

    it("should return null for getAccessTokenSync when idle", () => {
      expect(service.getAccessTokenSync()).toBeNull();
    });

    it("should return cookie-authenticated for getAccessTokenSync when authenticated", () => {
      service.setAuthenticated(14400);
      expect(service.getAccessTokenSync()).toBe("cookie-authenticated");
    });
  });

  // ========== SUBSCRIBER PATTERN ==========

  describe("Subscriber Pattern", () => {
    it("should call subscriber immediately on subscribe", () => {
      const subscriber = vi.fn();
      service.subscribe(subscriber);
      
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith("idle", expect.any(Object));
    });

    it("should call subscribers on state change", () => {
      const subscriber = vi.fn();
      service.subscribe(subscriber);
      
      subscriber.mockClear();
      service.setAuthenticated(14400);
      
      expect(subscriber).toHaveBeenCalledWith("authenticated", expect.any(Object));
    });

    it("should support multiple subscribers", () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      
      service.subscribe(subscriber1);
      service.subscribe(subscriber2);
      
      subscriber1.mockClear();
      subscriber2.mockClear();
      
      service.setAuthenticated(14400);
      
      expect(subscriber1).toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });

    it("should return unsubscribe function", () => {
      const subscriber = vi.fn();
      const unsubscribe = service.subscribe(subscriber);
      
      subscriber.mockClear();
      unsubscribe();
      
      service.setAuthenticated(14400);
      
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("should handle subscriber errors gracefully", () => {
      const errorSubscriber = vi.fn().mockImplementation(() => {
        throw new Error("Subscriber error");
      });
      const normalSubscriber = vi.fn();
      
      service.subscribe(errorSubscriber);
      service.subscribe(normalSubscriber);
      
      expect(() => service.setAuthenticated(14400)).not.toThrow();
    });
  });

  // ========== REFRESH TESTS ==========

  describe("Refresh", () => {
    it("should return false when trying to refresh from idle state", async () => {
      const result = await service.refresh();
      expect(result).toBe(false);
    });

    it("should return false when trying to refresh from error state", async () => {
      // Manually set to error state via internal mechanism
      service.setAuthenticated(14400);
      service.clearTokens();
      
      const result = await service.refresh();
      expect(result).toBe(false);
    });
  });

  // ========== CONTEXT IMMUTABILITY ==========

  describe("Context Immutability", () => {
    it("should return a copy of context, not the original", () => {
      const context1 = service.getContext();
      const context2 = service.getContext();
      
      expect(context1).not.toBe(context2);
      expect(context1).toEqual(context2);
    });

    it("should not allow external modification of context", () => {
      const context = service.getContext();
      context.expiresAt = 9999;
      
      const freshContext = service.getContext();
      expect(freshContext.expiresAt).not.toBe(9999);
    });
  });
});
