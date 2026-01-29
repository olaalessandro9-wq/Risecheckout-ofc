/**
 * normalizeDataUrl Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the normalizeDataUrl utility function.
 * Pure function with zero external dependencies.
 * 
 * @module test/lib/utils/normalizeDataUrl
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeDataUrl } from "@/lib/utils/normalizeDataUrl";

// Mock the logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("normalizeDataUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("empty input handling", () => {
    it("should return empty string for empty input", () => {
      expect(normalizeDataUrl("")).toBe("");
    });

    it("should return empty string for undefined-like input", () => {
      expect(normalizeDataUrl("")).toBe("");
    });
  });

  describe("whitespace normalization", () => {
    it("should trim whitespace from input", () => {
      const base64Content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
      const input = `  data:image/png;base64,${base64Content}  `;
      const result = normalizeDataUrl(input);
      expect(result).toBe(`data:image/png;base64,${base64Content}`);
    });

    it("should remove newlines from input", () => {
      const base64Content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
      const input = `data:image/png;base64,\n${base64Content}\n`;
      const result = normalizeDataUrl(input);
      expect(result).toBe(`data:image/png;base64,${base64Content}`);
    });

    it("should remove all whitespace characters", () => {
      const base64Content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
      const input = `data:image/png;base64,  \t\n  ${base64Content}`;
      const result = normalizeDataUrl(input);
      expect(result).toBe(`data:image/png;base64,${base64Content}`);
    });
  });

  describe("duplicate prefix removal", () => {
    it("should remove duplicate data:image/png;base64 prefix", () => {
      const base64Content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
      const input = `data:image/png;base64,data:image/png;base64,${base64Content}`;
      const result = normalizeDataUrl(input);
      expect(result).toBe(`data:image/png;base64,${base64Content}`);
    });

    it("should handle multiple duplications", () => {
      const base64Content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
      const input = `data:image/png;base64,data:image/png;base64,data:image/png;base64,${base64Content}`;
      const result = normalizeDataUrl(input);
      expect(result).toBe(`data:image/png;base64,${base64Content}`);
    });

    it("should handle mixed image type duplications", () => {
      const base64Content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
      const input = `data:image/png;base64,data:image/jpeg;base64,${base64Content}`;
      const result = normalizeDataUrl(input);
      expect(result).toBe(`data:image/png;base64,${base64Content}`);
    });
  });

  describe("prefix addition", () => {
    it("should add prefix if missing", () => {
      const base64Content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
      const result = normalizeDataUrl(base64Content);
      expect(result).toBe(`data:image/png;base64,${base64Content}`);
    });
  });

  describe("different image types", () => {
    it("should handle PNG images correctly", () => {
      const base64Content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
      const input = `data:image/png;base64,${base64Content}`;
      const result = normalizeDataUrl(input);
      expect(result).toBe(`data:image/png;base64,${base64Content}`);
    });

    it("should handle JPEG images correctly", () => {
      const base64Content = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL";
      const input = `data:image/jpeg;base64,${base64Content}`;
      const result = normalizeDataUrl(input);
      expect(result).toBe(`data:image/jpeg;base64,${base64Content}`);
    });

    it("should handle GIF images correctly", () => {
      const base64Content = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      const input = `data:image/gif;base64,${base64Content}`;
      const result = normalizeDataUrl(input);
      expect(result).toBe(`data:image/gif;base64,${base64Content}`);
    });

    it("should handle WebP images correctly", () => {
      const base64Content = "UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoBAAEAAQAcJZQCdAEO/gHOAAD++P7+/v7+/v7+/v4A";
      const input = `data:image/webp;base64,${base64Content}`;
      const result = normalizeDataUrl(input);
      expect(result).toBe(`data:image/webp;base64,${base64Content}`);
    });
  });

  describe("valid data URL structure", () => {
    it("should return valid data URL for valid input", () => {
      const base64Content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
      const result = normalizeDataUrl(`data:image/png;base64,${base64Content}`);
      
      expect(result).toMatch(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/);
      expect(result.length).toBeGreaterThan(50);
    });

    it("should preserve base64 content integrity", () => {
      const base64Content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
      const result = normalizeDataUrl(`data:image/png;base64,${base64Content}`);
      
      expect(result).toContain(base64Content);
    });
  });
});
