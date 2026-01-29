/**
 * Security Module Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for sanitization functions:
 * - HTML sanitization
 * - Text sanitization
 * - URL sanitization
 * - Color sanitization
 * - Form object sanitization
 */

import { describe, it, expect, vi } from "vitest";
import {
  sanitize,
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeColor,
  sanitizeFormObject,
  SAFE_HTML_CONFIG,
} from "../security";

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("Security", () => {
  // ========== SANITIZE (HTML) ==========

  describe("sanitize", () => {
    it("should allow safe HTML tags", () => {
      const input = "<p>Hello <strong>World</strong></p>";
      const result = sanitize(input);
      expect(result).toContain("<p>");
      expect(result).toContain("<strong>");
    });

    it("should remove script tags", () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitize(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
    });

    it("should remove iframe tags", () => {
      const input = '<p>Content</p><iframe src="evil.com"></iframe>';
      const result = sanitize(input);
      expect(result).not.toContain("<iframe>");
    });

    it("should remove event handlers", () => {
      const input = '<img src="img.jpg" onerror="alert(1)">';
      const result = sanitize(input);
      expect(result).not.toContain("onerror");
    });

    it("should remove onclick handlers", () => {
      const input = '<button onclick="stealData()">Click</button>';
      const result = sanitize(input);
      expect(result).not.toContain("onclick");
    });

    it("should allow href attribute on anchors", () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitize(input);
      expect(result).toContain('href="https://example.com"');
    });

    it("should return empty string for non-string input", () => {
      expect(sanitize(null)).toBe("");
      expect(sanitize(undefined)).toBe("");
      expect(sanitize(123)).toBe("");
      expect(sanitize({})).toBe("");
    });

    it("should trim whitespace", () => {
      const input = "  <p>Text</p>  ";
      const result = sanitize(input);
      expect(result).toBe("<p>Text</p>");
    });

    it("should handle complex XSS payloads", () => {
      // Test event handler removal
      const eventPayloads = [
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        '<body onload=alert(1)>',
      ];

      for (const payload of eventPayloads) {
        const result = sanitize(payload);
        expect(result).not.toContain("onerror");
        expect(result).not.toContain("onload");
      }

      // Test script/iframe removal
      expect(sanitize('"><script>alert(1)</script>')).not.toContain("<script>");
      expect(sanitize('<iframe src="evil.com">')).not.toContain("<iframe>");
    });
  });

  // ========== SANITIZE HTML (alias) ==========

  describe("sanitizeHtml", () => {
    it("should behave the same as sanitize", () => {
      const input = "<p>Hello <script>bad</script></p>";
      expect(sanitizeHtml(input)).toBe(sanitize(input));
    });
  });

  // ========== SANITIZE TEXT ==========

  describe("sanitizeText", () => {
    it("should remove ALL HTML tags", () => {
      const input = "<p>Hello <strong>World</strong></p>";
      const result = sanitizeText(input);
      expect(result).toBe("Hello World");
    });

    it("should remove even safe tags", () => {
      const input = "<a href='link'>Click here</a>";
      const result = sanitizeText(input);
      expect(result).toBe("Click here");
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizeText(null)).toBe("");
      expect(sanitizeText(undefined)).toBe("");
      expect(sanitizeText([])).toBe("");
    });

    it("should preserve plain text", () => {
      const input = "Just plain text without tags";
      expect(sanitizeText(input)).toBe("Just plain text without tags");
    });
  });

  // ========== SANITIZE URL ==========

  describe("sanitizeUrl", () => {
    it("should allow https URLs", () => {
      const url = "https://example.com/page?query=1";
      expect(sanitizeUrl(url)).toBe(url);
    });

    it("should allow http URLs", () => {
      const url = "http://example.com";
      expect(sanitizeUrl(url)).toBe(url);
    });

    it("should block javascript: protocol", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("");
      expect(sanitizeUrl("JAVASCRIPT:void(0)")).toBe("");
    });

    it("should block data: protocol", () => {
      expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
    });

    it("should block vbscript: protocol", () => {
      expect(sanitizeUrl("vbscript:msgbox(1)")).toBe("");
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizeUrl(null)).toBe("");
      expect(sanitizeUrl(undefined)).toBe("");
      expect(sanitizeUrl(123)).toBe("");
    });

    it("should trim whitespace", () => {
      expect(sanitizeUrl("  https://example.com  ")).toBe("https://example.com");
    });

    it("should allow relative URLs", () => {
      expect(sanitizeUrl("/path/to/page")).toBe("/path/to/page");
      expect(sanitizeUrl("./relative")).toBe("./relative");
    });
  });

  // ========== SANITIZE COLOR ==========

  describe("sanitizeColor", () => {
    it("should accept valid 6-digit hex color", () => {
      expect(sanitizeColor("#ff0000")).toBe("#ff0000");
      expect(sanitizeColor("#FF00FF")).toBe("#FF00FF");
      expect(sanitizeColor("#123abc")).toBe("#123abc");
    });

    it("should accept valid 3-digit hex color", () => {
      expect(sanitizeColor("#fff")).toBe("#fff");
      expect(sanitizeColor("#ABC")).toBe("#ABC");
    });

    it("should return default color for invalid format", () => {
      expect(sanitizeColor("red")).toBe("#000000");
      expect(sanitizeColor("rgb(255,0,0)")).toBe("#000000");
      expect(sanitizeColor("#gg0000")).toBe("#000000");
      expect(sanitizeColor("#1234567")).toBe("#000000");
    });

    it("should use custom default color", () => {
      expect(sanitizeColor("invalid", "#ffffff")).toBe("#ffffff");
    });

    it("should return default for non-string input", () => {
      expect(sanitizeColor(null)).toBe("#000000");
      expect(sanitizeColor(undefined)).toBe("#000000");
      expect(sanitizeColor(123)).toBe("#000000");
    });

    it("should trim whitespace", () => {
      expect(sanitizeColor("  #fff  ")).toBe("#fff");
    });
  });

  // ========== SANITIZE FORM OBJECT ==========

  describe("sanitizeFormObject", () => {
    it("should sanitize string fields", () => {
      const data = {
        name: "<script>alert(1)</script>John",
        age: 25,
        active: true,
      };

      const result = sanitizeFormObject(data);
      expect(result.name).not.toContain("<script>");
      expect(result.age).toBe(25);
      expect(result.active).toBe(true);
    });

    it("should sanitize URL fields specially", () => {
      const data = {
        websiteUrl: "javascript:alert(1)",
        shareLink: "https://valid.com",
        imageUrl: "data:text/html,bad",
      };

      const result = sanitizeFormObject(data);
      expect(result.websiteUrl).toBe("");
      expect(result.shareLink).toBe("https://valid.com");
      expect(result.imageUrl).toBe("");
    });

    it("should sanitize color fields specially", () => {
      const data = {
        backgroundColor: "#ff0000",
        textColor: "invalid",
        borderColor: "#fff",
      };

      const result = sanitizeFormObject(data);
      expect(result.backgroundColor).toBe("#ff0000");
      expect(result.textColor).toBe("#000000");
      expect(result.borderColor).toBe("#fff");
    });

    it("should not modify non-string values", () => {
      const data = {
        count: 42,
        enabled: true,
        missing: null,
      };

      const result = sanitizeFormObject(data);
      expect(result.count).toBe(42);
      expect(result.enabled).toBe(true);
      expect(result.missing).toBeNull();
    });

    it("should return a new object (not mutate original)", () => {
      const original = { name: "Test" };
      const result = sanitizeFormObject(original);
      
      expect(result).not.toBe(original);
      expect(original.name).toBe("Test");
    });
  });

  // ========== SAFE HTML CONFIG ==========

  describe("SAFE_HTML_CONFIG", () => {
    it("should have expected allowed tags", () => {
      expect(SAFE_HTML_CONFIG.ALLOWED_TAGS).toContain("p");
      expect(SAFE_HTML_CONFIG.ALLOWED_TAGS).toContain("a");
      expect(SAFE_HTML_CONFIG.ALLOWED_TAGS).toContain("img");
    });

    it("should have expected forbidden tags", () => {
      expect(SAFE_HTML_CONFIG.FORBID_TAGS).toContain("script");
      expect(SAFE_HTML_CONFIG.FORBID_TAGS).toContain("iframe");
    });

    it("should have expected forbidden attributes", () => {
      expect(SAFE_HTML_CONFIG.FORBID_ATTR).toContain("onerror");
      expect(SAFE_HTML_CONFIG.FORBID_ATTR).toContain("onclick");
    });
  });
});
