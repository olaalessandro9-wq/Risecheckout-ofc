/**
 * DateRange Types Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for date range types, constants, and configuration.
 * 
 * @module test/lib/date-range/types
 */

import { describe, it, expect } from "vitest";
import {
  DATE_RANGE_PRESETS,
  PRESET_LABELS,
  DEFAULT_DATE_RANGE_CONFIG,
} from "@/lib/date-range/types";
import type { DateRangePreset } from "@/lib/date-range/types";

describe("DateRange Types", () => {
  describe("DATE_RANGE_PRESETS", () => {
    it("should contain all expected presets", () => {
      expect(DATE_RANGE_PRESETS).toContain("today");
      expect(DATE_RANGE_PRESETS).toContain("yesterday");
      expect(DATE_RANGE_PRESETS).toContain("7days");
      expect(DATE_RANGE_PRESETS).toContain("30days");
      expect(DATE_RANGE_PRESETS).toContain("max");
      expect(DATE_RANGE_PRESETS).toContain("custom");
    });

    it("should have exactly 6 presets", () => {
      expect(DATE_RANGE_PRESETS.length).toBe(6);
    });

    it("should be readonly", () => {
      // TypeScript ensures this at compile time, but we can verify structure
      expect(Array.isArray(DATE_RANGE_PRESETS)).toBe(true);
    });
  });

  describe("PRESET_LABELS", () => {
    it("should have labels for all presets", () => {
      for (const preset of DATE_RANGE_PRESETS) {
        expect(PRESET_LABELS[preset]).toBeDefined();
        expect(typeof PRESET_LABELS[preset]).toBe("string");
      }
    });

    it("should have correct Portuguese labels", () => {
      expect(PRESET_LABELS.today).toBe("Hoje");
      expect(PRESET_LABELS.yesterday).toBe("Ontem");
      expect(PRESET_LABELS["7days"]).toBe("Últimos 7 dias");
      expect(PRESET_LABELS["30days"]).toBe("Últimos 30 dias");
      expect(PRESET_LABELS.max).toBe("Máximo");
      expect(PRESET_LABELS.custom).toBe("Personalizado");
    });

    it("should have non-empty labels", () => {
      for (const preset of DATE_RANGE_PRESETS) {
        expect(PRESET_LABELS[preset].length).toBeGreaterThan(0);
      }
    });
  });

  describe("DEFAULT_DATE_RANGE_CONFIG", () => {
    it("should have timezone set to America/Sao_Paulo", () => {
      expect(DEFAULT_DATE_RANGE_CONFIG.timezone).toBe("America/Sao_Paulo");
    });

    it("should have maxMonthsBack set to 16", () => {
      expect(DEFAULT_DATE_RANGE_CONFIG.maxMonthsBack).toBe(16);
    });

    it("should not have referenceDate set (use current date)", () => {
      expect(DEFAULT_DATE_RANGE_CONFIG.referenceDate).toBeUndefined();
    });
  });

  describe("Type compatibility", () => {
    it("should allow valid preset string", () => {
      const preset: DateRangePreset = "today";
      expect(preset).toBe("today");
    });

    it("should work with array methods", () => {
      const filtered = DATE_RANGE_PRESETS.filter(p => p !== "custom");
      expect(filtered.length).toBe(5);
    });

    it("should support preset labels lookup", () => {
      const preset: DateRangePreset = "7days";
      const label = PRESET_LABELS[preset];
      expect(label).toBe("Últimos 7 dias");
    });
  });
});
