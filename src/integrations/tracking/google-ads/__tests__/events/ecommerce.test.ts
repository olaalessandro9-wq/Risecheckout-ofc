/**
 * @file ecommerce.test.ts
 * @description Tests for Google Ads ecommerce events
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  trackPageView,
  trackAddToCart,
  trackViewItem,
} from "../../events/ecommerce";
import type { GoogleAdsConfig, GoogleAdsItem } from "../../types";

const mockGtag = vi.fn();

describe("Google Ads Ecommerce Events", () => {
  beforeEach(() => {
    (window as unknown as Record<string, unknown>).gtag = mockGtag;
    (window as unknown as Record<string, unknown>).dataLayer = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).gtag;
    delete (window as unknown as Record<string, unknown>).dataLayer;
  });

  describe("trackPageView", () => {
    it("should track page_view event", async () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };

      const result = await trackPageView(config);

      expect(mockGtag).toHaveBeenCalledWith("event", "page_view", {
        send_to: "AW-123456789",
      });
      expect(result.success).toBe(true);
    });

    it("should return error if gtag is not available", async () => {
      delete (window as unknown as Record<string, unknown>).gtag;

      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };

      const result = await trackPageView(config);

      expect(result.success).toBe(false);
      expect(result.message).toContain("gtag");
    });

    it("should handle errors during tracking", async () => {
      mockGtag.mockImplementationOnce(() => {
        throw new Error("Tracking error");
      });

      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };

      const result = await trackPageView(config);

      expect(result.success).toBe(false);
    });
  });

  describe("trackAddToCart", () => {
    it("should track add_to_cart event", async () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };

      const items: GoogleAdsItem[] = [
        {
          id: "prod_1",
          name: "Product 1",
          price: 99.9,
          quantity: 1,
        },
      ];

      const result = await trackAddToCart(config, items, 99.9);

      expect(mockGtag).toHaveBeenCalledWith("event", "add_to_cart", {
        send_to: "AW-123456789",
        value: 99.9,
        currency: "BRL",
        items: expect.arrayContaining([
          expect.objectContaining({
            id: "prod_1",
            name: "Product 1",
          }),
        ]),
      });
      expect(result.success).toBe(true);
    });

    it("should return error if gtag is not available", async () => {
      delete (window as unknown as Record<string, unknown>).gtag;

      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };

      const result = await trackAddToCart(config, [], 0);

      expect(result.success).toBe(false);
      expect(result.message).toContain("gtag");
    });

    it("should handle multiple items", async () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };

      const items: GoogleAdsItem[] = [
        {
          id: "prod_1",
          name: "Product 1",
          price: 99.9,
          quantity: 1,
        },
        {
          id: "prod_2",
          name: "Product 2",
          price: 49.9,
          quantity: 2,
        },
      ];

      await trackAddToCart(config, items, 199.7);

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "add_to_cart",
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ id: "prod_1" }),
            expect.objectContaining({ id: "prod_2" }),
          ]),
        })
      );
    });

    it("should handle errors during tracking", async () => {
      mockGtag.mockImplementationOnce(() => {
        throw new Error("Tracking error");
      });

      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };

      const result = await trackAddToCart(config, [], 0);

      expect(result.success).toBe(false);
    });
  });

  describe("trackViewItem", () => {
    it("should track view_item event", async () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };

      const item: GoogleAdsItem = {
        id: "prod_1",
        name: "Product 1",
        price: 99.9,
        quantity: 1,
        category: "Electronics",
      };

      const result = await trackViewItem(config, item);

      expect(mockGtag).toHaveBeenCalledWith("event", "view_item", {
        send_to: "AW-123456789",
        items: [
          {
            id: "prod_1",
            name: "Product 1",
            category: "Electronics",
            price: 99.9,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should return error if gtag is not available", async () => {
      delete (window as unknown as Record<string, unknown>).gtag;

      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };

      const item: GoogleAdsItem = {
        id: "prod_1",
        name: "Product 1",
        price: 99.9,
        quantity: 1,
      };

      const result = await trackViewItem(config, item);

      expect(result.success).toBe(false);
      expect(result.message).toContain("gtag");
    });

    it("should handle item without category", async () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };

      const item: GoogleAdsItem = {
        id: "prod_1",
        name: "Product 1",
        price: 99.9,
        quantity: 1,
      };

      await trackViewItem(config, item);

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "view_item",
        expect.objectContaining({
          items: [
            expect.objectContaining({
              id: "prod_1",
              name: "Product 1",
              category: undefined,
            }),
          ],
        })
      );
    });

    it("should handle errors during tracking", async () => {
      mockGtag.mockImplementationOnce(() => {
        throw new Error("Tracking error");
      });

      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };

      const item: GoogleAdsItem = {
        id: "prod_1",
        name: "Product 1",
        price: 99.9,
        quantity: 1,
      };

      const result = await trackViewItem(config, item);

      expect(result.success).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle SSR environment for all functions", async () => {
      const originalWindow = global.window;
      delete (global as { window?: Window }).window;

      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };

      const pageViewResult = await trackPageView(config);
      expect(pageViewResult.success).toBe(false);

      const addToCartResult = await trackAddToCart(config, [], 0);
      expect(addToCartResult.success).toBe(false);

      const item: GoogleAdsItem = {
        id: "prod_1",
        name: "Product 1",
        price: 99.9,
        quantity: 1,
      };
      const viewItemResult = await trackViewItem(config, item);
      expect(viewItemResult.success).toBe(false);

      (global as { window?: Window }).window = originalWindow;
    });
  });
});
