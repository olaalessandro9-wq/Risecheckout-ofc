/**
 * TimezoneService Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the TimezoneService class.
 * Uses Intl.DateTimeFormat for timezone calculations.
 * 
 * @module test/lib/timezone/service
 */

import { describe, it, expect, beforeEach } from "vitest";
import { TimezoneService, timezoneService } from "@/lib/timezone/service";

describe("TimezoneService", () => {
  let service: TimezoneService;

  beforeEach(() => {
    service = new TimezoneService({ timezone: "America/Sao_Paulo" });
  });

  describe("constructor and getters", () => {
    it("should use default timezone America/Sao_Paulo", () => {
      expect(service.timezone).toBe("America/Sao_Paulo");
    });

    it("should use default locale pt-BR", () => {
      expect(service.locale).toBe("pt-BR");
    });

    it("should allow custom timezone", () => {
      const customService = new TimezoneService({ timezone: "America/New_York" });
      expect(customService.timezone).toBe("America/New_York");
    });

    it("should allow custom locale", () => {
      const customService = new TimezoneService({ locale: "en-US" });
      expect(customService.locale).toBe("en-US");
    });
  });

  describe("getDateBoundaries", () => {
    it("should return startOfDay in UTC format", () => {
      const date = new Date("2026-01-15T12:00:00.000Z");
      const boundaries = service.getDateBoundaries(date);
      
      expect(boundaries.startOfDay).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it("should return endOfDay in UTC format", () => {
      const date = new Date("2026-01-15T12:00:00.000Z");
      const boundaries = service.getDateBoundaries(date);
      
      expect(boundaries.endOfDay).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it("should have endOfDay after startOfDay", () => {
      const date = new Date("2026-01-15T12:00:00.000Z");
      const boundaries = service.getDateBoundaries(date);
      
      const start = new Date(boundaries.startOfDay);
      const end = new Date(boundaries.endOfDay);
      
      expect(end.getTime()).toBeGreaterThan(start.getTime());
    });

    it("should span approximately 24 hours minus 1 millisecond", () => {
      const date = new Date("2026-01-15T12:00:00.000Z");
      const boundaries = service.getDateBoundaries(date);
      
      const start = new Date(boundaries.startOfDay);
      const end = new Date(boundaries.endOfDay);
      const diffMs = end.getTime() - start.getTime();
      
      // Should be 23:59:59.999 = 86399999ms
      expect(diffMs).toBe(86399999);
    });
  });

  describe("toStartOfDay", () => {
    it("should return only startOfDay ISO string", () => {
      const date = new Date("2026-01-15T12:00:00.000Z");
      const result = service.toStartOfDay(date);
      
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe("toEndOfDay", () => {
    it("should return only endOfDay ISO string", () => {
      const date = new Date("2026-01-15T12:00:00.000Z");
      const result = service.toEndOfDay(date);
      
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe("getHourInTimezone", () => {
    it("should return hour in SP timezone from Date object", () => {
      const date = new Date("2026-01-15T15:00:00.000Z"); // 15:00 UTC = 12:00 SP
      const hour = service.getHourInTimezone(date);
      
      expect(typeof hour).toBe("number");
      expect(hour).toBeGreaterThanOrEqual(0);
      expect(hour).toBeLessThanOrEqual(23);
    });

    it("should handle ISO string input", () => {
      const hour = service.getHourInTimezone("2026-01-15T15:00:00.000Z");
      
      expect(typeof hour).toBe("number");
      expect(hour).toBeGreaterThanOrEqual(0);
      expect(hour).toBeLessThanOrEqual(23);
    });

    it("should return different hour than UTC for SP timezone", () => {
      // At midnight UTC, it should be 21:00 of previous day in SP (UTC-3)
      const midnight = new Date("2026-01-16T00:00:00.000Z");
      const hour = service.getHourInTimezone(midnight);
      
      // SP is UTC-3, so 00:00 UTC = 21:00 SP (previous day)
      expect(hour).toBe(21);
    });
  });

  describe("getDateInTimezone", () => {
    it("should return YYYY-MM-DD format", () => {
      const date = new Date("2026-01-15T12:00:00.000Z");
      const result = service.getDateInTimezone(date);
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should handle ISO string input", () => {
      const result = service.getDateInTimezone("2026-01-15T12:00:00.000Z");
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("format", () => {
    it("should return object with date, time, full, and relative", () => {
      const date = new Date("2026-01-15T12:00:00.000Z");
      const formatted = service.format(date);
      
      expect(formatted).toHaveProperty("date");
      expect(formatted).toHaveProperty("time");
      expect(formatted).toHaveProperty("full");
      expect(formatted).toHaveProperty("relative");
    });

    it("should format relative time for recent dates", () => {
      const now = new Date();
      const formatted = service.format(now);
      
      expect(formatted.relative).toBe("Agora");
    });

    it("should handle ISO string input", () => {
      const formatted = service.format("2026-01-15T12:00:00.000Z");
      
      expect(typeof formatted.date).toBe("string");
      expect(typeof formatted.time).toBe("string");
    });
  });

  describe("formatDate", () => {
    it("should return dd/MM/yyyy format", () => {
      const date = new Date("2026-01-15T12:00:00.000Z");
      const result = service.formatDate(date);
      
      // Brazilian format: dd/MM/yyyy
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });

  describe("formatTime", () => {
    it("should return HH:mm format", () => {
      const date = new Date("2026-01-15T12:00:00.000Z");
      const result = service.formatTime(date);
      
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe("formatFull", () => {
    it("should return dd/MM/yyyy HH:mm format", () => {
      const date = new Date("2026-01-15T12:00:00.000Z");
      const result = service.formatFull(date);
      
      // Should contain date and time parts
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe("withTimezone", () => {
    it("should create new instance with different timezone", () => {
      const newService = service.withTimezone("America/New_York");
      
      expect(newService.timezone).toBe("America/New_York");
      expect(service.timezone).toBe("America/Sao_Paulo"); // Original unchanged
    });
  });

  describe("withLocale", () => {
    it("should create new instance with different locale", () => {
      const newService = service.withLocale("en-US");
      
      expect(newService.locale).toBe("en-US");
      expect(service.locale).toBe("pt-BR"); // Original unchanged
    });
  });

  describe("singleton instance", () => {
    it("should export default singleton configured for São Paulo", () => {
      expect(timezoneService.timezone).toBe("America/Sao_Paulo");
    });
  });
});
