/**
 * useAffiliateTracking.test.ts
 * 
 * Tests for affiliate tracking hook and utility functions
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  getAffiliateCode,
  getPendingAffiliateCode,
  clearAffiliateCode,
  clearPendingAffiliateCode,
  persistAffiliateCode,
} from "../useAffiliateTracking";

// Mock react-router-dom
const mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();

vi.mock("react-router-dom", () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

describe("useAffiliateTracking", () => {
  const STORAGE_KEY = "rise_affiliate_ref";
  const SESSION_STORAGE_KEY = "rise_affiliate_pending";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = `${STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    mockSearchParams.delete("ref");
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("getAffiliateCode", () => {
    it("should return null when no code is stored", () => {
      expect(getAffiliateCode()).toBeNull();
    });

    it("should return code from localStorage when valid", () => {
      const data = {
        code: "ABC123",
        expiresAt: Date.now() + 1000000,
        capturedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      expect(getAffiliateCode()).toBe("ABC123");
    });

    it("should return null and clear when localStorage code is expired", () => {
      const data = {
        code: "EXPIRED",
        expiresAt: Date.now() - 1000,
        capturedAt: Date.now() - 100000,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      expect(getAffiliateCode()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("should return null and clear when localStorage data is invalid", () => {
      localStorage.setItem(STORAGE_KEY, "invalid-json");

      expect(getAffiliateCode()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe("getPendingAffiliateCode", () => {
    it("should return null when no pending code", () => {
      expect(getPendingAffiliateCode()).toBeNull();
    });

    it("should return pending data from sessionStorage", () => {
      const data = {
        code: "PENDING123",
        capturedAt: Date.now(),
        sourceUrl: "https://example.com",
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));

      const result = getPendingAffiliateCode();
      expect(result?.code).toBe("PENDING123");
      expect(result?.sourceUrl).toBe("https://example.com");
    });

    it("should return null and clear when data is invalid", () => {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "invalid");

      expect(getPendingAffiliateCode()).toBeNull();
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });
  });

  describe("clearAffiliateCode", () => {
    it("should clear localStorage", () => {
      localStorage.setItem(STORAGE_KEY, "test");
      clearAffiliateCode();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe("clearPendingAffiliateCode", () => {
    it("should clear sessionStorage", () => {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "test");
      clearPendingAffiliateCode();
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });
  });

  describe("persistAffiliateCode", () => {
    it("should persist code with last_click attribution", () => {
      const result = persistAffiliateCode("NEWCODE", {
        cookieDuration: 30,
        attributionModel: "last_click",
      });

      expect(result).toBe(true);
      
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      expect(stored.code).toBe("NEWCODE");
      expect(stored.expiresAt).toBeGreaterThan(Date.now());
    });

    it("should NOT override with first_click attribution when code exists", () => {
      // First, store an existing code
      const existingData = {
        code: "EXISTING",
        expiresAt: Date.now() + 1000000,
        capturedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));

      // Try to persist new code with first_click
      const result = persistAffiliateCode("NEWCODE", {
        cookieDuration: 30,
        attributionModel: "first_click",
      });

      expect(result).toBe(false);
      
      // Original code should remain
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      expect(stored.code).toBe("EXISTING");
    });

    it("should override with last_click attribution when code exists", () => {
      // First, store an existing code
      const existingData = {
        code: "EXISTING",
        expiresAt: Date.now() + 1000000,
        capturedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));

      // Persist new code with last_click
      const result = persistAffiliateCode("NEWCODE", {
        cookieDuration: 30,
        attributionModel: "last_click",
      });

      expect(result).toBe(true);
      
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      expect(stored.code).toBe("NEWCODE");
    });

    it("should clear pending code after persistence", () => {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ code: "PENDING" }));

      persistAffiliateCode("CODE", {
        cookieDuration: 30,
        attributionModel: "last_click",
      });

      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });
  });
});
