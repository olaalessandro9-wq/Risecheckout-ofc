/**
 * Utils Module Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for general utility functions:
 * - cn (className merger)
 * - parseJsonSafely
 */

import { describe, it, expect, vi } from "vitest";
import { cn, parseJsonSafely } from "../utils";

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("Utils", () => {
  // ========== CN (CLASS NAME MERGER) ==========

  describe("cn", () => {
    it("should merge class names", () => {
      const result = cn("class1", "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      const result = cn("base", true && "included", false && "excluded");
      expect(result).toBe("base included");
    });

    it("should handle undefined values", () => {
      const result = cn("class1", undefined, "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle null values", () => {
      const result = cn("class1", null, "class2");
      expect(result).toBe("class1 class2");
    });

    it("should merge tailwind classes correctly", () => {
      // tailwind-merge should resolve conflicting classes
      const result = cn("p-4", "p-8");
      expect(result).toBe("p-8"); // Later class wins
    });

    it("should handle object syntax", () => {
      const result = cn({ active: true, disabled: false });
      expect(result).toBe("active");
    });

    it("should handle array syntax", () => {
      const result = cn(["class1", "class2"]);
      expect(result).toBe("class1 class2");
    });

    it("should handle empty input", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle complex responsive classes", () => {
      const result = cn("text-sm", "md:text-base", "lg:text-lg");
      expect(result).toContain("text-sm");
      expect(result).toContain("md:text-base");
      expect(result).toContain("lg:text-lg");
    });

    it("should merge color variants correctly", () => {
      const result = cn("text-red-500", "text-blue-500");
      expect(result).toBe("text-blue-500"); // Later class wins
    });

    it("should handle hover/focus states", () => {
      const result = cn("hover:bg-red-500", "hover:bg-blue-500");
      expect(result).toBe("hover:bg-blue-500"); // Later class wins
    });
  });

  // ========== PARSE JSON SAFELY ==========

  describe("parseJsonSafely", () => {
    it("should return object if already parsed", () => {
      const obj = { name: "Test", value: 123 };
      const result = parseJsonSafely(obj, {});
      expect(result).toEqual(obj);
    });

    it("should parse valid JSON string", () => {
      const jsonString = '{"name":"Test","value":123}';
      const result = parseJsonSafely<{ name: string; value: number }>(jsonString, { name: "", value: 0 });
      expect(result.name).toBe("Test");
      expect(result.value).toBe(123);
    });

    it("should return default value for invalid JSON", () => {
      const defaultValue = { fallback: true };
      const result = parseJsonSafely("not valid json", defaultValue);
      expect(result).toEqual(defaultValue);
    });

    it("should return default value for null", () => {
      const defaultValue = { default: true };
      const result = parseJsonSafely(null, defaultValue);
      expect(result).toEqual(defaultValue);
    });

    it("should return default value for undefined", () => {
      const defaultValue = { default: true };
      const result = parseJsonSafely(undefined, defaultValue);
      expect(result).toEqual(defaultValue);
    });

    it("should return default value for empty string", () => {
      const defaultValue = { default: true };
      const result = parseJsonSafely("", defaultValue);
      expect(result).toEqual(defaultValue);
    });

    it("should handle arrays", () => {
      const jsonArray = '[1, 2, 3]';
      const result = parseJsonSafely<number[]>(jsonArray, []);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should handle nested objects", () => {
      const nested = '{"outer":{"inner":"value"}}';
      const result = parseJsonSafely<{ outer: { inner: string } }>(nested, { outer: { inner: "" } });
      expect(result.outer.inner).toBe("value");
    });

    it("should handle JSON that parses to primitive (returns default)", () => {
      // JSON.parse('"string"') returns a string, not an object
      const result = parseJsonSafely('"just a string"', { default: true });
      expect(result).toEqual({ default: true });
    });

    it("should handle JSON that parses to number (returns default)", () => {
      const result = parseJsonSafely("123", { default: true });
      expect(result).toEqual({ default: true });
    });

    it("should pass through arrays (not strings)", () => {
      const arr = [1, 2, 3];
      const result = parseJsonSafely(arr, []);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should handle Supabase JSONB (already parsed)", () => {
      // Supabase returns JSONB columns as already-parsed objects
      const jsonbData = { settings: { theme: "dark" } };
      const result = parseJsonSafely(jsonbData, {});
      expect(result).toEqual(jsonbData);
    });
  });
});
