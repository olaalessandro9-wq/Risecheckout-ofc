/**
 * Field Limits Constants Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for field character limits used across the application.
 * 
 * @module test/lib/constants/field-limits
 */

import { describe, it, expect } from "vitest";
import {
  PRODUCT_FIELD_LIMITS,
  OFFER_FIELD_LIMITS,
  CHECKOUT_TEXT_LIMITS,
  TIMER_LIMITS,
  PRODUCT_DUPLICATION,
  FIXED_HEADER_LIMITS,
} from "@/lib/constants/field-limits";

describe("Field Limits Constants", () => {
  describe("PRODUCT_FIELD_LIMITS", () => {
    it("should have NAME limit of 100", () => {
      expect(PRODUCT_FIELD_LIMITS.NAME).toBe(100);
    });

    it("should have DESCRIPTION limit of 2000", () => {
      expect(PRODUCT_FIELD_LIMITS.DESCRIPTION).toBe(2000);
    });

    it("should be a const assertion object", () => {
      // TypeScript 'as const' creates readonly types at compile time
      // Runtime check: verify the object has expected structure
      expect(typeof PRODUCT_FIELD_LIMITS).toBe("object");
      expect(PRODUCT_FIELD_LIMITS).not.toBeNull();
    });
  });

  describe("OFFER_FIELD_LIMITS", () => {
    it("should have NAME limit of 100", () => {
      expect(OFFER_FIELD_LIMITS.NAME).toBe(100);
    });

    it("should be a const assertion object", () => {
      expect(typeof OFFER_FIELD_LIMITS).toBe("object");
      expect(OFFER_FIELD_LIMITS).not.toBeNull();
    });
  });

  describe("CHECKOUT_TEXT_LIMITS", () => {
    it("should have FONT_SIZE_MIN of 12", () => {
      expect(CHECKOUT_TEXT_LIMITS.FONT_SIZE_MIN).toBe(12);
    });

    it("should have FONT_SIZE_MAX of 48", () => {
      expect(CHECKOUT_TEXT_LIMITS.FONT_SIZE_MAX).toBe(48);
    });

    it("should have MIN less than MAX", () => {
      expect(CHECKOUT_TEXT_LIMITS.FONT_SIZE_MIN).toBeLessThan(
        CHECKOUT_TEXT_LIMITS.FONT_SIZE_MAX
      );
    });
  });

  describe("TIMER_LIMITS", () => {
    it("should have MINUTES_MIN of 0", () => {
      expect(TIMER_LIMITS.MINUTES_MIN).toBe(0);
    });

    it("should have MINUTES_MAX of 59", () => {
      expect(TIMER_LIMITS.MINUTES_MAX).toBe(59);
    });

    it("should have SECONDS_MIN of 0", () => {
      expect(TIMER_LIMITS.SECONDS_MIN).toBe(0);
    });

    it("should have SECONDS_MAX of 59", () => {
      expect(TIMER_LIMITS.SECONDS_MAX).toBe(59);
    });

    it("should have TEXT_MAX_LENGTH of 50", () => {
      expect(TIMER_LIMITS.TEXT_MAX_LENGTH).toBe(50);
    });
  });

  describe("PRODUCT_DUPLICATION", () => {
    it("should have COPY_SUFFIX", () => {
      expect(PRODUCT_DUPLICATION.COPY_SUFFIX).toBe(" (Cópia)");
    });

    it("should have correct COPY_SUFFIX_LENGTH", () => {
      expect(PRODUCT_DUPLICATION.COPY_SUFFIX_LENGTH).toBe(
        PRODUCT_DUPLICATION.COPY_SUFFIX.length
      );
    });

    it("should have MAX_NAME_LENGTH of 100", () => {
      expect(PRODUCT_DUPLICATION.MAX_NAME_LENGTH).toBe(100);
    });

    it("should have MAX_BASE_NAME_LENGTH of 88", () => {
      expect(PRODUCT_DUPLICATION.MAX_BASE_NAME_LENGTH).toBe(88);
    });

    it("should ensure MAX_BASE_NAME_LENGTH allows for suffix and counter", () => {
      // Base + suffix + counter (e.g., " 99") should fit within MAX_NAME_LENGTH
      const suffixLength = PRODUCT_DUPLICATION.COPY_SUFFIX_LENGTH;
      const counterSpace = 4; // " 99" = 4 chars
      const expectedMaxBase = PRODUCT_DUPLICATION.MAX_NAME_LENGTH - suffixLength - counterSpace;
      expect(PRODUCT_DUPLICATION.MAX_BASE_NAME_LENGTH).toBe(expectedMaxBase);
    });
  });

  describe("FIXED_HEADER_LIMITS", () => {
    it("should have TITLE_MAX of 60", () => {
      expect(FIXED_HEADER_LIMITS.TITLE_MAX).toBe(60);
    });

    it("should have TITLE_TRUNCATE_DISPLAY of 45", () => {
      expect(FIXED_HEADER_LIMITS.TITLE_TRUNCATE_DISPLAY).toBe(45);
    });

    it("should have DESCRIPTION_MAX of 300", () => {
      expect(FIXED_HEADER_LIMITS.DESCRIPTION_MAX).toBe(300);
    });

    it("should have CTA_BUTTON_TEXT_MAX of 30", () => {
      expect(FIXED_HEADER_LIMITS.CTA_BUTTON_TEXT_MAX).toBe(30);
    });

    it("should have TITLE_TRUNCATE_DISPLAY less than TITLE_MAX", () => {
      expect(FIXED_HEADER_LIMITS.TITLE_TRUNCATE_DISPLAY).toBeLessThan(
        FIXED_HEADER_LIMITS.TITLE_MAX
      );
    });
  });

  describe("value consistency", () => {
    it("should have all limits as positive numbers", () => {
      expect(PRODUCT_FIELD_LIMITS.NAME).toBeGreaterThan(0);
      expect(PRODUCT_FIELD_LIMITS.DESCRIPTION).toBeGreaterThan(0);
      expect(OFFER_FIELD_LIMITS.NAME).toBeGreaterThan(0);
      expect(CHECKOUT_TEXT_LIMITS.FONT_SIZE_MIN).toBeGreaterThanOrEqual(0);
      expect(CHECKOUT_TEXT_LIMITS.FONT_SIZE_MAX).toBeGreaterThan(0);
      expect(TIMER_LIMITS.TEXT_MAX_LENGTH).toBeGreaterThan(0);
      expect(FIXED_HEADER_LIMITS.TITLE_MAX).toBeGreaterThan(0);
    });

    it("should have PRODUCT and OFFER NAME limits be equal", () => {
      expect(PRODUCT_FIELD_LIMITS.NAME).toBe(OFFER_FIELD_LIMITS.NAME);
    });
  });
});
