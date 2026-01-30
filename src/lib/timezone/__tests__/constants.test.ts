/**
 * Timezone Constants Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for timezone constants, utilities, and validation functions.
 * 
 * @module test/lib/timezone/constants
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_TIMEZONE,
  DEFAULT_LOCALE,
  DEFAULT_CONFIG,
  SUPPORTED_TIMEZONES,
  getTimezoneOption,
  isValidTimezone,
} from "@/lib/timezone/constants";
import type { IANATimezone } from "@/lib/timezone/types";

describe("Timezone Constants", () => {
  describe("DEFAULT_TIMEZONE", () => {
    it("should be America/Sao_Paulo", () => {
      expect(DEFAULT_TIMEZONE).toBe("America/Sao_Paulo");
    });
  });

  describe("DEFAULT_LOCALE", () => {
    it("should be pt-BR", () => {
      expect(DEFAULT_LOCALE).toBe("pt-BR");
    });
  });

  describe("DEFAULT_CONFIG", () => {
    it("should have correct timezone", () => {
      expect(DEFAULT_CONFIG.timezone).toBe("America/Sao_Paulo");
    });

    it("should have correct locale", () => {
      expect(DEFAULT_CONFIG.locale).toBe("pt-BR");
    });
  });

  describe("SUPPORTED_TIMEZONES", () => {
    it("should contain America/Sao_Paulo", () => {
      const sp = SUPPORTED_TIMEZONES.find(tz => tz.value === "America/Sao_Paulo");
      expect(sp).toBeDefined();
      expect(sp?.label).toBe("Brasília");
    });

    it("should contain UTC", () => {
      const utc = SUPPORTED_TIMEZONES.find(tz => tz.value === "UTC");
      expect(utc).toBeDefined();
      expect(utc?.offset).toBe("GMT+0");
    });

    it("should have all required properties for each timezone", () => {
      for (const tz of SUPPORTED_TIMEZONES) {
        expect(tz).toHaveProperty("value");
        expect(tz).toHaveProperty("label");
        expect(tz).toHaveProperty("offset");
        expect(typeof tz.value).toBe("string");
        expect(typeof tz.label).toBe("string");
        expect(typeof tz.offset).toBe("string");
      }
    });

    it("should contain at least 10 timezones", () => {
      expect(SUPPORTED_TIMEZONES.length).toBeGreaterThanOrEqual(10);
    });

    it("should contain Brazil timezones", () => {
      const brazilTimezones = SUPPORTED_TIMEZONES.filter(
        tz => tz.value.startsWith("America/") && 
        ["Sao_Paulo", "Manaus", "Fortaleza", "Recife"].some(city => tz.value.includes(city))
      );
      expect(brazilTimezones.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("getTimezoneOption", () => {
    it("should return timezone option for valid timezone", () => {
      const option = getTimezoneOption("America/Sao_Paulo");
      expect(option).toBeDefined();
      expect(option?.value).toBe("America/Sao_Paulo");
      expect(option?.label).toBe("Brasília");
    });

    it("should return undefined for invalid timezone", () => {
      const option = getTimezoneOption("Invalid/Timezone" as IANATimezone);
      expect(option).toBeUndefined();
    });

    it("should return correct option for UTC", () => {
      const option = getTimezoneOption("UTC");
      expect(option).toBeDefined();
      expect(option?.label).toBe("UTC");
    });

    it("should return correct option for America/New_York", () => {
      const option = getTimezoneOption("America/New_York");
      expect(option).toBeDefined();
      expect(option?.label).toBe("New York (EST)");
    });
  });

  describe("isValidTimezone", () => {
    it("should return true for valid timezone", () => {
      expect(isValidTimezone("America/Sao_Paulo")).toBe(true);
    });

    it("should return true for UTC", () => {
      expect(isValidTimezone("UTC")).toBe(true);
    });

    it("should return false for invalid timezone", () => {
      expect(isValidTimezone("Invalid/Timezone")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidTimezone("")).toBe(false);
    });

    it("should return false for partial timezone name", () => {
      expect(isValidTimezone("America")).toBe(false);
    });

    it("should handle all supported timezones", () => {
      for (const tz of SUPPORTED_TIMEZONES) {
        expect(isValidTimezone(tz.value)).toBe(true);
      }
    });
  });
});
