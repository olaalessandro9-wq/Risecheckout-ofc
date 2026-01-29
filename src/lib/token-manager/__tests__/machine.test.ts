/**
 * Token Manager Machine Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Token Lifecycle FSM.
 * 
 * @module token-manager/__tests__
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  transition,
  INITIAL_STATE,
  INITIAL_CONTEXT,
  canMakeApiCalls,
  needsRefresh,
  isExpired,
} from "../machine";
import type { TokenState, TokenContext, TokenEvent } from "../types";
import { TOKEN_TIMING } from "../types";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createContext(overrides: Partial<TokenContext> = {}): TokenContext {
  return { ...INITIAL_CONTEXT, ...overrides };
}

// ============================================================================
// INITIAL STATE TESTS
// ============================================================================

describe("Token Machine Initial State", () => {
  it("has correct initial state", () => {
    expect(INITIAL_STATE).toBe("idle");
  });

  it("has correct initial context", () => {
    expect(INITIAL_CONTEXT.expiresAt).toBeNull();
    expect(INITIAL_CONTEXT.lastRefreshAttempt).toBeNull();
    expect(INITIAL_CONTEXT.errorMessage).toBeNull();
    expect(INITIAL_CONTEXT.refreshFailureCount).toBe(0);
  });
});

// ============================================================================
// IDLE STATE TRANSITIONS
// ============================================================================

describe("Idle State Transitions", () => {
  it("transitions to authenticated on LOGIN_SUCCESS", () => {
    const result = transition("idle", { type: "LOGIN_SUCCESS", expiresIn: 3600 }, INITIAL_CONTEXT);
    
    expect(result).not.toBeNull();
    expect(result?.nextState).toBe("authenticated");
    expect(result?.nextContext.expiresAt).toBeGreaterThan(Date.now());
    expect(result?.nextContext.refreshFailureCount).toBe(0);
  });

  it("returns null for invalid events in idle", () => {
    expect(transition("idle", { type: "LOGOUT" } as TokenEvent, INITIAL_CONTEXT)).toBeNull();
    expect(transition("idle", { type: "REFRESH_START" } as TokenEvent, INITIAL_CONTEXT)).toBeNull();
    expect(transition("idle", { type: "TIMER_EXPIRED" } as TokenEvent, INITIAL_CONTEXT)).toBeNull();
  });
});

// ============================================================================
// AUTHENTICATED STATE TRANSITIONS
// ============================================================================

describe("Authenticated State Transitions", () => {
  const authenticatedContext = createContext({
    expiresAt: Date.now() + 3600000,
    refreshFailureCount: 0,
  });

  it("transitions to expiring on TIMER_NEAR_EXPIRY", () => {
    const result = transition("authenticated", { type: "TIMER_NEAR_EXPIRY" }, authenticatedContext);
    
    expect(result?.nextState).toBe("expiring");
    expect(result?.nextContext).toEqual(authenticatedContext);
  });

  it("transitions to expired on TIMER_EXPIRED", () => {
    const result = transition("authenticated", { type: "TIMER_EXPIRED" }, authenticatedContext);
    
    expect(result?.nextState).toBe("expired");
    expect(result?.nextContext.errorMessage).toBe("Token expired");
  });

  it("transitions to idle on LOGOUT", () => {
    const result = transition("authenticated", { type: "LOGOUT" }, authenticatedContext);
    
    expect(result?.nextState).toBe("idle");
    expect(result?.nextContext).toEqual(INITIAL_CONTEXT);
  });

  it("returns null for invalid events", () => {
    expect(transition("authenticated", { type: "LOGIN_SUCCESS", expiresIn: 3600 }, authenticatedContext)).toBeNull();
    expect(transition("authenticated", { type: "REFRESH_START" } as TokenEvent, authenticatedContext)).toBeNull();
  });
});

// ============================================================================
// EXPIRING STATE TRANSITIONS
// ============================================================================

describe("Expiring State Transitions", () => {
  const expiringContext = createContext({
    expiresAt: Date.now() + 60000,
  });

  it("transitions to refreshing on REFRESH_START", () => {
    const result = transition("expiring", { type: "REFRESH_START" }, expiringContext);
    
    expect(result?.nextState).toBe("refreshing");
    expect(result?.nextContext.lastRefreshAttempt).toBeGreaterThan(0);
  });

  it("transitions to expired on TIMER_EXPIRED", () => {
    const result = transition("expiring", { type: "TIMER_EXPIRED" }, expiringContext);
    
    expect(result?.nextState).toBe("expired");
    expect(result?.nextContext.errorMessage).toContain("expired");
  });

  it("transitions to idle on LOGOUT", () => {
    const result = transition("expiring", { type: "LOGOUT" }, expiringContext);
    
    expect(result?.nextState).toBe("idle");
    expect(result?.nextContext).toEqual(INITIAL_CONTEXT);
  });
});

// ============================================================================
// REFRESHING STATE TRANSITIONS
// ============================================================================

describe("Refreshing State Transitions", () => {
  const refreshingContext = createContext({
    expiresAt: Date.now() + 60000,
    lastRefreshAttempt: Date.now(),
    refreshFailureCount: 0,
  });

  it("transitions to authenticated on REFRESH_SUCCESS", () => {
    const result = transition("refreshing", { type: "REFRESH_SUCCESS", expiresIn: 3600 }, refreshingContext);
    
    expect(result?.nextState).toBe("authenticated");
    expect(result?.nextContext.expiresAt).toBeGreaterThan(Date.now());
    expect(result?.nextContext.errorMessage).toBeNull();
    expect(result?.nextContext.refreshFailureCount).toBe(0);
  });

  it("transitions to expired on REFRESH_FAILED (first failure)", () => {
    const result = transition("refreshing", { type: "REFRESH_FAILED", error: "Network error" }, refreshingContext);
    
    expect(result?.nextState).toBe("expired");
    expect(result?.nextContext.errorMessage).toBe("Network error");
    expect(result?.nextContext.refreshFailureCount).toBe(1);
  });

  it("transitions to error after MAX_REFRESH_FAILURES", () => {
    const contextNearMax = createContext({
      refreshFailureCount: TOKEN_TIMING.MAX_REFRESH_FAILURES - 1,
    });
    
    const result = transition("refreshing", { type: "REFRESH_FAILED", error: "Failed" }, contextNearMax);
    
    expect(result?.nextState).toBe("error");
    expect(result?.nextContext.refreshFailureCount).toBe(TOKEN_TIMING.MAX_REFRESH_FAILURES);
  });

  it("transitions to idle on LOGOUT", () => {
    const result = transition("refreshing", { type: "LOGOUT" }, refreshingContext);
    
    expect(result?.nextState).toBe("idle");
  });
});

// ============================================================================
// EXPIRED STATE TRANSITIONS
// ============================================================================

describe("Expired State Transitions", () => {
  const expiredContext = createContext({
    expiresAt: Date.now() - 1000,
    errorMessage: "Token expired",
    refreshFailureCount: 1,
  });

  it("transitions to refreshing on RETRY_REFRESH", () => {
    const result = transition("expired", { type: "RETRY_REFRESH" }, expiredContext);
    
    expect(result?.nextState).toBe("refreshing");
    expect(result?.nextContext.lastRefreshAttempt).toBeGreaterThan(0);
  });

  it("transitions to authenticated on LOGIN_SUCCESS", () => {
    const result = transition("expired", { type: "LOGIN_SUCCESS", expiresIn: 3600 }, expiredContext);
    
    expect(result?.nextState).toBe("authenticated");
    expect(result?.nextContext.refreshFailureCount).toBe(0);
  });

  it("transitions to idle on CLEAR", () => {
    const result = transition("expired", { type: "CLEAR" }, expiredContext);
    
    expect(result?.nextState).toBe("idle");
    expect(result?.nextContext).toEqual(INITIAL_CONTEXT);
  });

  it("transitions to idle on LOGOUT", () => {
    const result = transition("expired", { type: "LOGOUT" }, expiredContext);
    
    expect(result?.nextState).toBe("idle");
  });
});

// ============================================================================
// ERROR STATE TRANSITIONS
// ============================================================================

describe("Error State Transitions", () => {
  const errorContext = createContext({
    errorMessage: "Too many refresh failures",
    refreshFailureCount: TOKEN_TIMING.MAX_REFRESH_FAILURES,
  });

  it("transitions to idle on CLEAR", () => {
    const result = transition("error", { type: "CLEAR" }, errorContext);
    
    expect(result?.nextState).toBe("idle");
    expect(result?.nextContext).toEqual(INITIAL_CONTEXT);
  });

  it("transitions to idle on LOGOUT", () => {
    const result = transition("error", { type: "LOGOUT" }, errorContext);
    
    expect(result?.nextState).toBe("idle");
  });

  it("transitions to authenticated on LOGIN_SUCCESS", () => {
    const result = transition("error", { type: "LOGIN_SUCCESS", expiresIn: 3600 }, errorContext);
    
    expect(result?.nextState).toBe("authenticated");
    expect(result?.nextContext.errorMessage).toBeNull();
    expect(result?.nextContext.refreshFailureCount).toBe(0);
  });

  it("returns null for invalid events", () => {
    expect(transition("error", { type: "REFRESH_START" } as TokenEvent, errorContext)).toBeNull();
    expect(transition("error", { type: "TIMER_EXPIRED" } as TokenEvent, errorContext)).toBeNull();
  });
});

// ============================================================================
// STATE PREDICATES
// ============================================================================

describe("State Predicates", () => {
  describe("canMakeApiCalls", () => {
    it("returns true for authenticated, expiring, and refreshing states", () => {
      expect(canMakeApiCalls("authenticated")).toBe(true);
      expect(canMakeApiCalls("expiring")).toBe(true);
      expect(canMakeApiCalls("refreshing")).toBe(true);
    });

    it("returns false for idle, expired, and error states", () => {
      expect(canMakeApiCalls("idle")).toBe(false);
      expect(canMakeApiCalls("expired")).toBe(false);
      expect(canMakeApiCalls("error")).toBe(false);
    });
  });

  describe("needsRefresh", () => {
    it("returns false when expiresAt is null", () => {
      expect(needsRefresh(INITIAL_CONTEXT)).toBe(false);
    });

    it("returns true when near expiry threshold", () => {
      const context = createContext({
        expiresAt: Date.now() + TOKEN_TIMING.REFRESH_THRESHOLD_MS - 1000,
      });
      expect(needsRefresh(context)).toBe(true);
    });

    it("returns false when far from expiry", () => {
      const context = createContext({
        expiresAt: Date.now() + TOKEN_TIMING.REFRESH_THRESHOLD_MS + 60000,
      });
      expect(needsRefresh(context)).toBe(false);
    });
  });

  describe("isExpired", () => {
    it("returns true when expiresAt is null", () => {
      expect(isExpired(INITIAL_CONTEXT)).toBe(true);
    });

    it("returns true when expiresAt is in the past", () => {
      const context = createContext({ expiresAt: Date.now() - 1000 });
      expect(isExpired(context)).toBe(true);
    });

    it("returns false when expiresAt is in the future", () => {
      const context = createContext({ expiresAt: Date.now() + 60000 });
      expect(isExpired(context)).toBe(false);
    });
  });
});
