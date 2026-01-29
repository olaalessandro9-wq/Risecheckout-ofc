/**
 * Token Persistence Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for localStorage operations:
 * - Persist token state
 * - Restore token state
 * - Clear persisted state
 * - Error handling (QuotaExceeded, SecurityError)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { 
  persistTokenState, 
  restoreTokenState, 
  clearPersistedState,
  type PersistedState,
} from "../persistence";
import type { TokenState, TokenContext } from "../types";
import { STORAGE_KEYS } from "../types";

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("TokenPersistence", () => {
  const mockStorage: Record<string, string> = {};
  
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    
    // Mock localStorage
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      mockStorage[key] = value;
    });
    
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      return mockStorage[key] ?? null;
    });
    
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
      delete mockStorage[key];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== PERSIST TOKEN STATE ==========

  describe("persistTokenState", () => {
    it("should persist authenticated state correctly", () => {
      const state: TokenState = "authenticated";
      const context: TokenContext = {
        expiresAt: Date.now() + 14400000,
        lastRefreshAttempt: Date.now(),
        errorMessage: null,
        refreshFailureCount: 0,
      };

      persistTokenState("unified", state, context);

      expect(mockStorage[STORAGE_KEYS.unified.state]).toBe("authenticated");
      expect(mockStorage[STORAGE_KEYS.unified.expiresAt]).toBe(String(context.expiresAt));
      expect(mockStorage[STORAGE_KEYS.unified.lastRefresh]).toBe(String(context.lastRefreshAttempt));
    });

    it("should clear storage when state is idle", () => {
      // First, set some values
      mockStorage[STORAGE_KEYS.unified.state] = "authenticated";
      mockStorage[STORAGE_KEYS.unified.expiresAt] = "1234567890";

      persistTokenState("unified", "idle", {
        expiresAt: null,
        lastRefreshAttempt: null,
        errorMessage: null,
        refreshFailureCount: 0,
      });

      expect(mockStorage[STORAGE_KEYS.unified.state]).toBeUndefined();
      expect(mockStorage[STORAGE_KEYS.unified.expiresAt]).toBeUndefined();
    });

    it("should not persist expiresAt if null", () => {
      persistTokenState("unified", "authenticated", {
        expiresAt: null,
        lastRefreshAttempt: 12345,
        errorMessage: null,
        refreshFailureCount: 0,
      });

      expect(mockStorage[STORAGE_KEYS.unified.state]).toBe("authenticated");
      expect(mockStorage[STORAGE_KEYS.unified.expiresAt]).toBeUndefined();
      expect(mockStorage[STORAGE_KEYS.unified.lastRefresh]).toBe("12345");
    });

    it("should not persist lastRefreshAttempt if null", () => {
      persistTokenState("unified", "authenticated", {
        expiresAt: 12345,
        lastRefreshAttempt: null,
        errorMessage: null,
        refreshFailureCount: 0,
      });

      expect(mockStorage[STORAGE_KEYS.unified.state]).toBe("authenticated");
      expect(mockStorage[STORAGE_KEYS.unified.expiresAt]).toBe("12345");
      expect(mockStorage[STORAGE_KEYS.unified.lastRefresh]).toBeUndefined();
    });

    it("should handle QuotaExceededError gracefully", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        const error = new Error("QuotaExceeded");
        error.name = "QuotaExceededError";
        throw error;
      });

      expect(() => {
        persistTokenState("unified", "authenticated", {
          expiresAt: 12345,
          lastRefreshAttempt: null,
          errorMessage: null,
          refreshFailureCount: 0,
        });
      }).not.toThrow();
    });

    it("should handle SecurityError gracefully", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Access denied", "SecurityError");
      });

      expect(() => {
        persistTokenState("unified", "authenticated", {
          expiresAt: 12345,
          lastRefreshAttempt: null,
          errorMessage: null,
          refreshFailureCount: 0,
        });
      }).not.toThrow();
    });
  });

  // ========== RESTORE TOKEN STATE ==========

  describe("restoreTokenState", () => {
    it("should restore valid persisted state", () => {
      const expiresAt = Date.now() + 14400000;
      const lastRefresh = Date.now();

      mockStorage[STORAGE_KEYS.unified.state] = "authenticated";
      mockStorage[STORAGE_KEYS.unified.expiresAt] = String(expiresAt);
      mockStorage[STORAGE_KEYS.unified.lastRefresh] = String(lastRefresh);

      const result = restoreTokenState("unified");

      expect(result.state).toBe("authenticated");
      expect(result.expiresAt).toBe(expiresAt);
      expect(result.lastRefreshAttempt).toBe(lastRefresh);
    });

    it("should return null values when no state is persisted", () => {
      const result = restoreTokenState("unified");

      expect(result.state).toBeNull();
      expect(result.expiresAt).toBeNull();
      expect(result.lastRefreshAttempt).toBeNull();
    });

    it("should return null for invalid numeric values", () => {
      mockStorage[STORAGE_KEYS.unified.state] = "authenticated";
      mockStorage[STORAGE_KEYS.unified.expiresAt] = "not-a-number";

      const result = restoreTokenState("unified");

      expect(result.state).toBe("authenticated");
      expect(result.expiresAt).toBeNull(); // NaN becomes null
    });

    it("should handle localStorage access errors gracefully", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage not available");
      });

      const result = restoreTokenState("unified");

      expect(result.state).toBeNull();
      expect(result.expiresAt).toBeNull();
      expect(result.lastRefreshAttempt).toBeNull();
    });

    it("should restore state without lastRefreshAttempt", () => {
      mockStorage[STORAGE_KEYS.unified.state] = "expiring";
      mockStorage[STORAGE_KEYS.unified.expiresAt] = "12345";

      const result = restoreTokenState("unified");

      expect(result.state).toBe("expiring");
      expect(result.expiresAt).toBe(12345);
      expect(result.lastRefreshAttempt).toBeNull();
    });
  });

  // ========== CLEAR PERSISTED STATE ==========

  describe("clearPersistedState", () => {
    it("should remove all keys for token type", () => {
      mockStorage[STORAGE_KEYS.unified.state] = "authenticated";
      mockStorage[STORAGE_KEYS.unified.expiresAt] = "12345";
      mockStorage[STORAGE_KEYS.unified.lastRefresh] = "67890";

      clearPersistedState("unified");

      expect(mockStorage[STORAGE_KEYS.unified.state]).toBeUndefined();
      expect(mockStorage[STORAGE_KEYS.unified.expiresAt]).toBeUndefined();
      expect(mockStorage[STORAGE_KEYS.unified.lastRefresh]).toBeUndefined();
    });

    it("should not throw when keys don't exist", () => {
      expect(() => clearPersistedState("unified")).not.toThrow();
    });

    it("should handle localStorage errors gracefully", () => {
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      expect(() => clearPersistedState("unified")).not.toThrow();
    });
  });

  // ========== STORAGE KEYS CONSISTENCY ==========

  describe("Storage Keys", () => {
    it("should use correct key prefixes for unified type", () => {
      expect(STORAGE_KEYS.unified.state).toBe("unified_auth_state");
      expect(STORAGE_KEYS.unified.expiresAt).toBe("unified_auth_expires_at");
      expect(STORAGE_KEYS.unified.lastRefresh).toBe("unified_auth_last_refresh");
    });
  });
});
