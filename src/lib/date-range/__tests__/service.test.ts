/**
 * DateRangeService Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the DateRangeService class.
 * Uses fixed reference dates for deterministic results.
 * 
 * @module test/lib/date-range/service
 */

import { describe, it, expect } from "vitest";
import { DateRangeService, dateRangeService } from "@/lib/date-range/service";
import type { DateRangePreset } from "@/lib/date-range/types";

describe("DateRangeService", () => {
  // Fixed reference date for deterministic tests: Jan 15, 2026 12:00 UTC
  const referenceDate = new Date("2026-01-15T12:00:00.000Z");

  describe("constructor", () => {
    it("should create service with default config", () => {
      const service = new DateRangeService();
      expect(service.timezone).toBe("America/Sao_Paulo");
    });

    it("should allow custom timezone", () => {
      const service = new DateRangeService({ timezone: "America/New_York" });
      expect(service.timezone).toBe("America/New_York");
    });

    it("should allow custom reference date", () => {
      const service = new DateRangeService({ referenceDate });
      expect(service.timezone).toBe("America/Sao_Paulo");
    });
  });

  describe("getRange - today", () => {
    it("should return today preset", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getRange("today");

      expect(range.preset).toBe("today");
      expect(range.timezone).toBe("America/Sao_Paulo");
    });

    it("should return valid ISO strings", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getRange("today");

      expect(range.startISO).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      expect(range.endISO).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it("should have startDate before endDate", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getRange("today");

      expect(range.startDate.getTime()).toBeLessThan(range.endDate.getTime());
    });

    it("should span approximately 24 hours", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getRange("today");

      const diffMs = range.endDate.getTime() - range.startDate.getTime();
      // 23:59:59.999 = 86399999ms
      expect(diffMs).toBe(86399999);
    });
  });

  describe("getRange - yesterday", () => {
    it("should return yesterday preset", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getRange("yesterday");

      expect(range.preset).toBe("yesterday");
    });

    it("should be before today range", () => {
      const service = new DateRangeService({ referenceDate });
      const today = service.getRange("today");
      const yesterday = service.getRange("yesterday");

      expect(yesterday.endDate.getTime()).toBeLessThan(today.startDate.getTime());
    });
  });

  describe("getRange - 7days", () => {
    it("should return 7days preset", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getRange("7days");

      expect(range.preset).toBe("7days");
    });

    it("should span 7 complete days", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getRange("7days");

      const diffMs = range.endDate.getTime() - range.startDate.getTime();
      // 7 days = 6 * 86400000 + 86399999 (includes today)
      const expectedMs = 6 * 86400000 + 86399999;
      expect(diffMs).toBe(expectedMs);
    });

    it("should include today", () => {
      const service = new DateRangeService({ referenceDate });
      const sevenDays = service.getRange("7days");
      const today = service.getRange("today");

      expect(sevenDays.endISO).toBe(today.endISO);
    });
  });

  describe("getRange - 30days", () => {
    it("should return 30days preset", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getRange("30days");

      expect(range.preset).toBe("30days");
    });

    it("should span 30 complete days", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getRange("30days");

      const diffMs = range.endDate.getTime() - range.startDate.getTime();
      // 30 days = 29 * 86400000 + 86399999 (includes today)
      const expectedMs = 29 * 86400000 + 86399999;
      expect(diffMs).toBe(expectedMs);
    });
  });

  describe("getRange - max", () => {
    it("should return max preset", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getRange("max");

      expect(range.preset).toBe("max");
    });

    it("should start 16 months before reference date by default", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getRange("max");

      // referenceDate is Jan 15, 2026 → 16 months back → Sep 15, 2024
      const startYear = range.startDate.getFullYear();
      expect(startYear).toBe(2024);
    });

    it("should end at today", () => {
      const service = new DateRangeService({ referenceDate });
      const max = service.getRange("max");
      const today = service.getRange("today");

      expect(max.endISO).toBe(today.endISO);
    });

    it("should use timezone-aware boundaries for start date", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getRange("max");

      // Start should be at a clean day boundary (00:00:00.000 in timezone)
      expect(range.startISO).toMatch(/T\d{2}:00:00\.000Z$/);
    });

    it("should allow custom maxMonthsBack", () => {
      const service = new DateRangeService({ referenceDate, maxMonthsBack: 6 });
      const range = service.getRange("max");

      // referenceDate is Jan 15, 2026 → 6 months back → Jul 15, 2025
      expect(range.startDate.getFullYear()).toBe(2025);
      expect(range.startDate.getMonth()).toBeGreaterThanOrEqual(6); // July or later
    });
  });

  describe("getCustomRange", () => {
    it("should return custom preset", () => {
      const service = new DateRangeService({ referenceDate });
      const customRange = {
        from: new Date("2026-01-10T00:00:00.000Z"),
        to: new Date("2026-01-12T00:00:00.000Z"),
      };
      const range = service.getCustomRange(customRange);

      expect(range.preset).toBe("custom");
    });

    it("should use provided date range", () => {
      const service = new DateRangeService({ referenceDate });
      const from = new Date("2026-01-10T00:00:00.000Z");
      const to = new Date("2026-01-12T00:00:00.000Z");
      const range = service.getCustomRange({ from, to });

      expect(range.startDate).toBeDefined();
      expect(range.endDate).toBeDefined();
    });

    it("should include timezone in output", () => {
      const service = new DateRangeService({ referenceDate });
      const range = service.getCustomRange({
        from: new Date("2026-01-10T00:00:00.000Z"),
        to: new Date("2026-01-12T00:00:00.000Z"),
      });

      expect(range.timezone).toBe("America/Sao_Paulo");
    });
  });

  describe("withTimezone", () => {
    it("should create new service with different timezone", () => {
      const service = new DateRangeService({ referenceDate });
      const newService = service.withTimezone("America/New_York");

      expect(newService.timezone).toBe("America/New_York");
      expect(service.timezone).toBe("America/Sao_Paulo");
    });

    it("should produce different boundaries for different timezones", () => {
      const service = new DateRangeService({ referenceDate });
      const spRange = service.getRange("today");

      const nyService = service.withTimezone("America/New_York");
      const nyRange = nyService.getRange("today");

      // Different timezones = different UTC boundaries
      expect(spRange.startISO).not.toBe(nyRange.startISO);
    });
  });

  describe("withReferenceDate", () => {
    it("should create new service with different reference date", () => {
      const service = new DateRangeService();
      const newDate = new Date("2025-06-15T12:00:00.000Z");
      const newService = service.withReferenceDate(newDate);

      const range = newService.getRange("today");
      expect(range.startDate.getFullYear()).toBe(2025);
    });
  });

  describe("singleton instance", () => {
    it("should export default singleton", () => {
      expect(dateRangeService).toBeInstanceOf(DateRangeService);
    });

    it("should be configured for São Paulo", () => {
      expect(dateRangeService.timezone).toBe("America/Sao_Paulo");
    });
  });

  describe("type safety", () => {
    it("should throw for invalid preset", () => {
      const service = new DateRangeService({ referenceDate });
      
      expect(() => {
        // @ts-expect-error Testing runtime error for invalid preset
        service.getRange("invalid" as DateRangePreset);
      }).toThrow();
    });
  });
});
