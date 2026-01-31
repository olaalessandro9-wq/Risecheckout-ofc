/**
 * @file index.test.ts
 * @description Tests for Facebook Pixel barrel exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import * as FacebookPixel from "../index";

describe("Facebook Pixel Barrel Exports", () => {
  describe("Module Exports", () => {
    it("should export Pixel component", () => {
      expect(FacebookPixel.Pixel).toBeDefined();
      expect(typeof FacebookPixel.Pixel).toBe("function");
    });

    it("should export trackEvent function", () => {
      expect(FacebookPixel.trackEvent).toBeDefined();
      expect(typeof FacebookPixel.trackEvent).toBe("function");
    });

    it("should export trackCustomEvent function", () => {
      expect(FacebookPixel.trackCustomEvent).toBeDefined();
      expect(typeof FacebookPixel.trackCustomEvent).toBe("function");
    });

    it("should export trackViewContent function", () => {
      expect(FacebookPixel.trackViewContent).toBeDefined();
      expect(typeof FacebookPixel.trackViewContent).toBe("function");
    });

    it("should export trackInitiateCheckout function", () => {
      expect(FacebookPixel.trackInitiateCheckout).toBeDefined();
      expect(typeof FacebookPixel.trackInitiateCheckout).toBe("function");
    });

    it("should export trackPurchase function", () => {
      expect(FacebookPixel.trackPurchase).toBeDefined();
      expect(typeof FacebookPixel.trackPurchase).toBe("function");
    });

    it("should export trackAddToCart function", () => {
      expect(FacebookPixel.trackAddToCart).toBeDefined();
      expect(typeof FacebookPixel.trackAddToCart).toBe("function");
    });

    it("should export trackCompleteRegistration function", () => {
      expect(FacebookPixel.trackCompleteRegistration).toBeDefined();
      expect(typeof FacebookPixel.trackCompleteRegistration).toBe("function");
    });

    it("should export trackPageView function", () => {
      expect(FacebookPixel.trackPageView).toBeDefined();
      expect(typeof FacebookPixel.trackPageView).toBe("function");
    });

    it("should export trackLead function", () => {
      expect(FacebookPixel.trackLead).toBeDefined();
      expect(typeof FacebookPixel.trackLead).toBe("function");
    });
  });

  describe("Export Count", () => {
    it("should export exactly 10 members", () => {
      const exports = Object.keys(FacebookPixel);

      expect(exports).toHaveLength(10);
    });
  });

  describe("Export Names", () => {
    it("should have correct export names", () => {
      const exports = Object.keys(FacebookPixel);
      const expectedExports = [
        "Pixel",
        "trackEvent",
        "trackCustomEvent",
        "trackViewContent",
        "trackInitiateCheckout",
        "trackPurchase",
        "trackAddToCart",
        "trackCompleteRegistration",
        "trackPageView",
        "trackLead",
      ];

      expectedExports.forEach((exportName) => {
        expect(exports).toContain(exportName);
      });
    });
  });
});
