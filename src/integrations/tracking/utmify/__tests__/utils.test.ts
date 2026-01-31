/**
 * @file utils.test.ts
 * @description Tests for UTMify utility functions
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { extractUTMParameters, formatDateForUTMify } from "../utils";

describe("UTMify Utils", () => {
  describe("extractUTMParameters", () => {
    it("should extract all UTM parameters from URL", () => {
      const url = "https://example.com?utm_source=google&utm_campaign=summer&utm_medium=cpc&utm_content=ad1&utm_term=shoes&src=fb&sck=123";
      const params = extractUTMParameters(url);

      expect(params.utm_source).toBe("google");
      expect(params.utm_campaign).toBe("summer");
      expect(params.utm_medium).toBe("cpc");
      expect(params.utm_content).toBe("ad1");
      expect(params.utm_term).toBe("shoes");
      expect(params.src).toBe("fb");
      expect(params.sck).toBe("123");
    });

    it("should return null for missing parameters", () => {
      const url = "https://example.com?utm_source=google";
      const params = extractUTMParameters(url);

      expect(params.utm_source).toBe("google");
      expect(params.utm_campaign).toBeNull();
      expect(params.utm_medium).toBeNull();
      expect(params.utm_content).toBeNull();
      expect(params.utm_term).toBeNull();
    });

    it("should handle URL without parameters", () => {
      const url = "https://example.com";
      const params = extractUTMParameters(url);

      expect(params.utm_source).toBeNull();
      expect(params.utm_campaign).toBeNull();
      expect(params.src).toBeNull();
    });

    it("should use window.location.href if no URL provided", () => {
      const originalLocation = window.location;
      delete (window as { location?: Location }).location;
      Object.defineProperty(window, "location", {
        value: { href: "https://example.com?utm_source=test" },
        writable: true,
        configurable: true,
      });

      const params = extractUTMParameters();

      expect(params.utm_source).toBe("test");

      window.location = originalLocation;
    });

    it("should handle invalid URLs gracefully", () => {
      const params = extractUTMParameters("not-a-valid-url");

      expect(params.utm_source).toBeNull();
      expect(params.utm_campaign).toBeNull();
    });
  });

  describe("formatDateForUTMify", () => {
    it("should format Date object correctly", () => {
      const date = new Date("2025-01-15T10:30:45Z");
      const formatted = formatDateForUTMify(date);

      expect(formatted).toBe("2025-01-15 10:30:45");
    });

    it("should format date string correctly", () => {
      const formatted = formatDateForUTMify("2025-01-15T10:30:45Z");

      expect(formatted).toBe("2025-01-15 10:30:45");
    });

    it("should pad single digits with zeros", () => {
      const date = new Date("2025-01-05T09:05:03Z");
      const formatted = formatDateForUTMify(date);

      expect(formatted).toBe("2025-01-05 09:05:03");
    });

    it("should handle midnight correctly", () => {
      const date = new Date("2025-01-01T00:00:00Z");
      const formatted = formatDateForUTMify(date);

      expect(formatted).toBe("2025-01-01 00:00:00");
    });

    it("should handle end of day correctly", () => {
      const date = new Date("2025-12-31T23:59:59Z");
      const formatted = formatDateForUTMify(date);

      expect(formatted).toBe("2025-12-31 23:59:59");
    });
  });

  describe("Edge Cases", () => {
    it("should handle URLs with special characters", () => {
      const url = "https://example.com?utm_source=google%20ads&utm_campaign=test%2Bcampaign";
      const params = extractUTMParameters(url);

      expect(params.utm_source).toBe("google ads");
      expect(params.utm_campaign).toBe("test+campaign");
    });

    it("should handle duplicate parameters", () => {
      const url = "https://example.com?utm_source=first&utm_source=second";
      const params = extractUTMParameters(url);

      expect(params.utm_source).toBeTruthy();
    });
  });
});
