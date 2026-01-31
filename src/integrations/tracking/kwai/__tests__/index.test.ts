/**
 * @file index.test.ts
 * @description Tests for Kwai Pixel barrel exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import * as KwaiPixel from "../index";

describe("Kwai Pixel Barrel Exports", () => {
  describe("Module Exports", () => {
    it("should export Pixel component", () => {
      expect(KwaiPixel.Pixel).toBeDefined();
      expect(typeof KwaiPixel.Pixel).toBe("function");
    });

    it("should export isValidKwaiConfig function", () => {
      expect(KwaiPixel.isValidKwaiConfig).toBeDefined();
      expect(typeof KwaiPixel.isValidKwaiConfig).toBe("function");
    });

    it("should export sendKwaiEvent function", () => {
      expect(KwaiPixel.sendKwaiEvent).toBeDefined();
      expect(typeof KwaiPixel.sendKwaiEvent).toBe("function");
    });

    it("should export trackPurchase function", () => {
      expect(KwaiPixel.trackPurchase).toBeDefined();
      expect(typeof KwaiPixel.trackPurchase).toBe("function");
    });

    it("should export trackViewContent function", () => {
      expect(KwaiPixel.trackViewContent).toBeDefined();
      expect(typeof KwaiPixel.trackViewContent).toBe("function");
    });

    it("should export trackAddToCart function", () => {
      expect(KwaiPixel.trackAddToCart).toBeDefined();
      expect(typeof KwaiPixel.trackAddToCart).toBe("function");
    });

    it("should export trackPageView function", () => {
      expect(KwaiPixel.trackPageView).toBeDefined();
      expect(typeof KwaiPixel.trackPageView).toBe("function");
    });

    it("should export trackLead function", () => {
      expect(KwaiPixel.trackLead).toBeDefined();
      expect(typeof KwaiPixel.trackLead).toBe("function");
    });
  });

  describe("Export Count", () => {
    it("should export expected number of members", () => {
      const exports = Object.keys(KwaiPixel);
      expect(exports.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe("Export Names", () => {
    it("should have correct export names", () => {
      const exports = Object.keys(KwaiPixel);
      const expectedExports = [
        "Pixel",
        "isValidKwaiConfig",
        "sendKwaiEvent",
        "trackPurchase",
        "trackViewContent",
        "trackAddToCart",
        "trackPageView",
        "trackLead",
      ];

      expectedExports.forEach((exportName) => {
        expect(exports).toContain(exportName);
      });
    });
  });
});
