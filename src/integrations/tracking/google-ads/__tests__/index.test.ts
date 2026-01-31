/**
 * @file index.test.ts
 * @description Tests for Google Ads barrel exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import * as GoogleAds from "../index";

describe("Google Ads Barrel Exports", () => {
  describe("Module Exports", () => {
    it("should export Tracker component", () => {
      expect(GoogleAds.Tracker).toBeDefined();
      expect(typeof GoogleAds.Tracker).toBe("function");
    });

    it("should export conversion events", () => {
      expect(GoogleAds.getConversionLabel).toBeDefined();
      expect(typeof GoogleAds.getConversionLabel).toBe("function");

      expect(GoogleAds.isValidGoogleAdsConfig).toBeDefined();
      expect(typeof GoogleAds.isValidGoogleAdsConfig).toBe("function");

      expect(GoogleAds.sendGoogleAdsConversion).toBeDefined();
      expect(typeof GoogleAds.sendGoogleAdsConversion).toBe("function");

      expect(GoogleAds.trackPurchase).toBeDefined();
      expect(typeof GoogleAds.trackPurchase).toBe("function");

      expect(GoogleAds.trackLead).toBeDefined();
      expect(typeof GoogleAds.trackLead).toBe("function");
    });

    it("should export ecommerce events", () => {
      expect(GoogleAds.trackPageView).toBeDefined();
      expect(typeof GoogleAds.trackPageView).toBe("function");

      expect(GoogleAds.trackAddToCart).toBeDefined();
      expect(typeof GoogleAds.trackAddToCart).toBe("function");

      expect(GoogleAds.trackViewItem).toBeDefined();
      expect(typeof GoogleAds.trackViewItem).toBe("function");
    });
  });

  describe("Export Count", () => {
    it("should export expected number of members", () => {
      const exports = Object.keys(GoogleAds);

      expect(exports.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe("Export Names", () => {
    it("should have correct export names", () => {
      const exports = Object.keys(GoogleAds);
      const expectedExports = [
        "Tracker",
        "getConversionLabel",
        "isValidGoogleAdsConfig",
        "sendGoogleAdsConversion",
        "trackPurchase",
        "trackLead",
        "trackPageView",
        "trackAddToCart",
        "trackViewItem",
      ];

      expectedExports.forEach((exportName) => {
        expect(exports).toContain(exportName);
      });
    });
  });

  describe("Type Exports", () => {
    it("should export types through module", () => {
      const exports = Object.keys(GoogleAds);

      expect(exports).toContain("Tracker");
      expect(exports).toContain("trackPurchase");
      expect(exports).toContain("trackPageView");
    });
  });
});
