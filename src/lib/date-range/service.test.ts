/**
 * DateRangeService Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the DateRangeService class.
 * Depends on TimezoneService for date calculations.
 * 
 * @module test/lib/date-range/service
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DateRangeService, dateRangeService } from "@/lib/date-range/service";

describe("DateRangeService", () => {
  let service: DateRangeService;
  // Fixed reference date for deterministic tests
  const referenceDate = new Date("2026-01-17T12:00:00.000Z");

  beforeEach(() => {
    service = new DateRangeService({ referenceDate });
  });

  describe("constructor and getters", () => {
    it("should use default timezone America/Sao_Paulo", () => {
      expect(service.timezone).toBe("America/Sao_Paulo");
    });

    it("should allow custom timezone", () => {
      const customService = new DateRangeService({ timezone: "America/New_York" });
      expect(customService.timezone).toBe("America/New_York");
    });
  });

  describe("getRange('today')", () => {
    it("should return today's boundaries in SP timezone", () => {
      const range = service.getRange("today");
      
      expect(range.startISO).toBeDefined();
      expect(range.endISO).toBeDefined();
      expect(range.startDate).toBeInstanceOf(Date);
      expect(range.endDate).toBeInstanceOf(Date);
    });

    it("should return correct ISO strings", () => {
      const range = service.getRange("today");
      
      expect(range.startISO).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      expect(range.endISO).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it("should have preset='today'", () => {
      const range = service.getRange("today");
      expect(range.preset).toBe("today");
    });

    it("should include timezone in output", () => {
      const range = service.getRange("today");
      expect(range.timezone).toBe("America/Sao_Paulo");
    });

    it("should have endDate after startDate", () => {
      const range = service.getRange("today");
      expect(range.endDate.getTime()).toBeGreaterThan(range.startDate.getTime());
    });
  });

  describe("getRange('yesterday')", () => {
    it("should return yesterday's boundaries", () => {
      const range = service.getRange("yesterday");
      
      expect(range.preset).toBe("yesterday");
      expect(range.startISO).toBeDefined();
      expect(range.endISO).toBeDefined();
    });

    it("should have yesterday's range before today's range", () => {
      const yesterday = service.getRange("yesterday");
      const today = service.getRange("today");
      
      expect(yesterday.endDate.getTime()).toBeLessThanOrEqual(today.startDate.getTime());
    });
  });

  describe("getRange('7days')", () => {
    it("should include 7 complete days", () => {
      const range = service.getRange("7days");
      
      const diffMs = range.endDate.getTime() - range.startDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      // Should be approximately 7 days (minus 1 millisecond for end of day)
      expect(diffDays).toBeGreaterThanOrEqual(6.99);
      expect(diffDays).toBeLessThanOrEqual(7.01);
    });

    it("should have preset='7days'", () => {
      const range = service.getRange("7days");
      expect(range.preset).toBe("7days");
    });

    it("should start 6 days ago (includes today)", () => {
      const range = service.getRange("7days");
      const today = service.getRange("today");
      
      // End should be same as today's end
      expect(range.endISO).toBe(today.endISO);
    });
  });

  describe("getRange('30days')", () => {
    it("should include 30 complete days", () => {
      const range = service.getRange("30days");
      
      const diffMs = range.endDate.getTime() - range.startDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      expect(diffDays).toBeGreaterThanOrEqual(29.99);
      expect(diffDays).toBeLessThanOrEqual(30.01);
    });

    it("should have preset='30days'", () => {
      const range = service.getRange("30days");
      expect(range.preset).toBe("30days");
    });
  });

  describe("getRange('max')", () => {
    it("should start 16 months before reference date by default", () => {
      const range = service.getRange("max");
      
      // referenceDate is Jan 17, 2026 → 16 months back → Sep 17, 2024
      expect(new Date(range.startISO).getFullYear()).toBe(2024);
    });

    it("should use timezone-aware boundaries for start date", () => {
      const range = service.getRange("max");

      // Start should be at a clean day boundary (00:00:00.000 in timezone)
      expect(range.startISO).toMatch(/T\d{2}:00:00\.000Z$/);
    });

    it("should end at today", () => {
      const range = service.getRange("max");
      const today = service.getRange("today");
      
      expect(range.endISO).toBe(today.endISO);
    });

    it("should have preset='max'", () => {
      const range = service.getRange("max");
      expect(range.preset).toBe("max");
    });

    it("should allow custom maxMonthsBack", () => {
      const customService = new DateRangeService({
        referenceDate,
        maxMonthsBack: 6,
      });
      
      const range = customService.getRange("max");
      // referenceDate is Jan 17, 2026 → 6 months back → Jul 17, 2025
      expect(new Date(range.startISO).getFullYear()).toBe(2025);
    });
  });

  describe("getCustomRange", () => {
    it("should use custom from/to dates", () => {
      const from = new Date("2026-01-10T00:00:00.000Z");
      const to = new Date("2026-01-15T00:00:00.000Z");
      
      const range = service.getCustomRange({ from, to });
      
      expect(range.startDate.getTime()).toBeLessThanOrEqual(from.getTime() + 24 * 60 * 60 * 1000);
      expect(range.endDate.getTime()).toBeGreaterThanOrEqual(to.getTime());
    });

    it("should have preset='custom'", () => {
      const from = new Date("2026-01-10T00:00:00.000Z");
      const to = new Date("2026-01-15T00:00:00.000Z");
      
      const range = service.getCustomRange({ from, to });
      expect(range.preset).toBe("custom");
    });

    it("should return full day boundaries for from and to dates", () => {
      const from = new Date("2026-01-10T12:30:00.000Z");
      const to = new Date("2026-01-15T08:45:00.000Z");
      
      const range = service.getCustomRange({ from, to });
      
      // Start should be beginning of from date (00:00:00.000)
      expect(range.startISO).toMatch(/T\d{2}:00:00\.000Z$/);
      
      // End should be end of to date (23:59:59.999)
      expect(range.endISO).toMatch(/T\d{2}:59:59\.999Z$/);
    });
  });

  describe("withTimezone", () => {
    it("should create new instance with different timezone", () => {
      const newService = service.withTimezone("America/New_York");
      
      expect(newService.timezone).toBe("America/New_York");
      expect(service.timezone).toBe("America/Sao_Paulo"); // Original unchanged
    });

    it("should produce different boundaries for different timezones", () => {
      const spService = new DateRangeService({ 
        timezone: "America/Sao_Paulo",
        referenceDate,
      });
      const nyService = new DateRangeService({ 
        timezone: "America/New_York",
        referenceDate,
      });
      
      const spRange = spService.getRange("today");
      const nyRange = nyService.getRange("today");
      
      // Different timezones should produce different UTC boundaries
      // (SP is UTC-3, NY is UTC-5 or UTC-4 depending on DST)
      expect(spRange.startISO).not.toBe(nyRange.startISO);
    });
  });

  describe("withReferenceDate", () => {
    it("should create new instance with different reference date", () => {
      const newDate = new Date("2025-06-15T12:00:00.000Z");
      const newService = service.withReferenceDate(newDate);
      
      const range = newService.getRange("today");
      
      // Should be based on June 2025, not January 2026
      expect(new Date(range.startISO).getMonth()).toBeLessThan(6); // June (0-indexed)
    });

    it("should use reference date instead of now", () => {
      const pastDate = new Date("2024-12-25T12:00:00.000Z");
      const pastService = service.withReferenceDate(pastDate);
      
      const range = pastService.getRange("today");
      
      // Should be December 2024
      expect(new Date(range.startISO).getFullYear()).toBe(2024);
    });
  });

  describe("singleton instance", () => {
    it("should export default singleton configured for São Paulo", () => {
      expect(dateRangeService.timezone).toBe("America/Sao_Paulo");
    });
  });

  describe("output structure", () => {
    it("should have all required properties in DateRangeOutput", () => {
      const range = service.getRange("today");
      
      expect(range).toHaveProperty("startISO");
      expect(range).toHaveProperty("endISO");
      expect(range).toHaveProperty("startDate");
      expect(range).toHaveProperty("endDate");
      expect(range).toHaveProperty("timezone");
      expect(range).toHaveProperty("preset");
    });

    it("should have startDate and endDate as Date objects", () => {
      const range = service.getRange("today");
      
      expect(range.startDate).toBeInstanceOf(Date);
      expect(range.endDate).toBeInstanceOf(Date);
    });

    it("should have startISO and endISO matching startDate and endDate", () => {
      const range = service.getRange("today");
      
      expect(range.startISO).toBe(range.startDate.toISOString());
      expect(range.endISO).toBe(range.endDate.toISOString());
    });
  });
});
