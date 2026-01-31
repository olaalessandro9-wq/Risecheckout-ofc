/**
 * @file index.test.ts
 * @description Tests for TikTok Pixel barrel exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import * as TikTokPixel from "../index";

describe("TikTok Pixel Barrel Exports", () => {
  describe("Module Exports", () => {
    it("should export Pixel component", () => {
      expect(TikTokPixel.Pixel).toBeDefined();
      expect(typeof TikTokPixel.Pixel).toBe("function");
    });

    it("should export isValidTikTokConfig function", () => {
      expect(TikTokPixel.isValidTikTokConfig).toBeDefined();
      expect(typeof TikTokPixel.isValidTikTokConfig).toBe("function");
    });

    it("should export sendTikTokEvent function", () => {
      expect(TikTokPixel.sendTikTokEvent).toBeDefined();
      expect(typeof TikTokPixel.sendTikTokEvent).toBe("function");
    });

    it("should export trackPurchase function", () => {
      expect(TikTokPixel.trackPurchase).toBeDefined();
      expect(typeof TikTokPixel.trackPurchase).toBe("function");
    });

    it("should export trackViewContent function", () => {
      expect(TikTokPixel.trackViewContent).toBeDefined();
      expect(typeof TikTokPixel.trackViewContent).toBe("function");
    });

    it("should export trackAddToCart function", () => {
      expect(TikTokPixel.trackAddToCart).toBeDefined();
      expect(typeof TikTokPixel.trackAddToCart).toBe("function");
    });

    it("should export trackPageView function", () => {
      expect(TikTokPixel.trackPageView).toBeDefined();
      expect(typeof TikTokPixel.trackPageView).toBe("function");
    });

    it("should export trackLead function", () => {
      expect(TikTokPixel.trackLead).toBeDefined();
      expect(typeof TikTokPixel.trackLead).toBe("function");
    });

    it("should export trackInitiateCheckout function", () => {
      expect(TikTokPixel.trackInitiateCheckout).toBeDefined();
      expect(typeof TikTokPixel.trackInitiateCheckout).toBe("function");
    });

    it("should export trackRefund function", () => {
      expect(TikTokPixel.trackRefund).toBeDefined();
      expect(typeof TikTokPixel.trackRefund).toBe("function");
    });
  });

  describe("Export Count", () => {
    it("should export exactly 10 members", () => {
      const exports = Object.keys(TikTokPixel);

      expect(exports).toHaveLength(10);
    });
  });

  describe("Export Names", () => {
    it("should have correct export names", () => {
      const exports = Object.keys(TikTokPixel);
      const expectedExports = [
        "Pixel",
        "isValidTikTokConfig",
        "sendTikTokEvent",
        "trackPurchase",
        "trackViewContent",
        "trackAddToCart",
        "trackPageView",
        "trackLead",
        "trackInitiateCheckout",
        "trackRefund",
      ];

      expectedExports.forEach((exportName) => {
        expect(exports).toContain(exportName);
      });
    });
  });
});
