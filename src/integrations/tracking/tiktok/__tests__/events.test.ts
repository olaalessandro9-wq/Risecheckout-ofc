/**
 * @file events.test.ts
 * @description Tests for TikTok Pixel events
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isValidTikTokConfig,
  sendTikTokEvent,
  trackPurchase,
  trackViewContent,
  trackAddToCart,
  trackPageView,
  trackLead,
  trackInitiateCheckout,
  trackRefund,
} from "../events";
import type { TikTokConfig, TikTokItem, TikTokCustomer } from "../types";

const mockTtq = {
  track: vi.fn(),
};

describe("TikTok Pixel Events", () => {
  beforeEach(() => {
    (window as Record<string, unknown>).ttq = mockTtq;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as Record<string, unknown>).ttq;
  });

  describe("isValidTikTokConfig", () => {
    it("should return true for valid config", () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      expect(isValidTikTokConfig(config)).toBe(true);
    });

    it("should return false for config without pixel_id", () => {
      const config: TikTokConfig = {
        pixel_id: "",
        enabled: true,
      };

      expect(isValidTikTokConfig(config)).toBe(false);
    });
  });

  describe("sendTikTokEvent", () => {
    it("should send event with ttq.track", async () => {
      const result = await sendTikTokEvent("123456789", "TestEvent", {
        value: 100,
        currency: "BRL",
      });

      expect(mockTtq.track).toHaveBeenCalledWith("TestEvent", expect.any(Object));
      expect(result.success).toBe(true);
    });

    it("should return error if pixel_id is empty", async () => {
      const result = await sendTikTokEvent("", "TestEvent", {});

      expect(result.success).toBe(false);
      expect(result.message).toContain("Pixel ID");
    });

    it("should return error if ttq is not available", async () => {
      delete (window as Record<string, unknown>).ttq;

      const result = await sendTikTokEvent("123456789", "TestEvent", {});

      expect(result.success).toBe(false);
      expect(result.message).toContain("ttq");
    });

    it("should include customer data in event", async () => {
      const customer: TikTokCustomer = {
        email: "test@example.com",
        phone: "+5511999999999",
        name: "Test User",
      };

      await sendTikTokEvent("123456789", "TestEvent", {
        customer,
      });

      expect(mockTtq.track).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({
          email: "test@example.com",
          phone_number: "+5511999999999",
          user_name: "Test User",
        })
      );
    });

    it("should include items in event", async () => {
      const items: TikTokItem[] = [
        {
          id: "prod_1",
          name: "Product 1",
          price: 99.9,
          quantity: 1,
        },
      ];

      await sendTikTokEvent("123456789", "TestEvent", {
        items,
      });

      expect(mockTtq.track).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              content_id: "prod_1",
              content_name: "Product 1",
            }),
          ]),
        })
      );
    });
  });

  describe("trackPurchase", () => {
    it("should track Purchase event", async () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const items: TikTokItem[] = [
        {
          id: "prod_1",
          name: "Product 1",
          price: 99.9,
          quantity: 1,
        },
      ];

      const result = await trackPurchase(config, "order_123", 99.9, items);

      expect(mockTtq.track).toHaveBeenCalledWith("Purchase", expect.any(Object));
      expect(result.success).toBe(true);
    });

    it("should include order_id in Purchase event", async () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      await trackPurchase(config, "order_456", 150.0);

      expect(mockTtq.track).toHaveBeenCalledWith(
        "Purchase",
        expect.objectContaining({
          event_id: "purchase_order_456",
        })
      );
    });
  });

  describe("trackViewContent", () => {
    it("should track ViewContent event", async () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const item: TikTokItem = {
        id: "prod_1",
        name: "Product 1",
        price: 99.9,
        quantity: 1,
      };

      const result = await trackViewContent(config, item);

      expect(mockTtq.track).toHaveBeenCalledWith("ViewContent", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackAddToCart", () => {
    it("should track AddToCart event", async () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const items: TikTokItem[] = [
        {
          id: "prod_1",
          name: "Product 1",
          price: 99.9,
          quantity: 1,
        },
      ];

      const result = await trackAddToCart(config, items, 99.9);

      expect(mockTtq.track).toHaveBeenCalledWith("AddToCart", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackPageView", () => {
    it("should track PageView event", async () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const result = await trackPageView(config);

      expect(mockTtq.track).toHaveBeenCalledWith("PageView", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackLead", () => {
    it("should track Contact event", async () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const customer: TikTokCustomer = {
        email: "lead@example.com",
      };

      const result = await trackLead(config, customer);

      expect(mockTtq.track).toHaveBeenCalledWith("Contact", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackInitiateCheckout", () => {
    it("should track InitiateCheckout event", async () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const items: TikTokItem[] = [
        {
          id: "prod_1",
          name: "Product 1",
          price: 99.9,
          quantity: 1,
        },
      ];

      const result = await trackInitiateCheckout(config, items, 99.9);

      expect(mockTtq.track).toHaveBeenCalledWith("InitiateCheckout", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackRefund", () => {
    it("should track Refund event", async () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const result = await trackRefund(config, "order_123", 99.9);

      expect(mockTtq.track).toHaveBeenCalledWith("Refund", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle SSR environment", async () => {
      const originalWindow = global.window;
      delete (global as { window?: Window }).window;

      const result = await sendTikTokEvent("123456789", "TestEvent", {});

      expect(result.success).toBe(false);

      (global as { window?: Window }).window = originalWindow;
    });

    it("should handle errors during tracking", async () => {
      mockTtq.track.mockImplementationOnce(() => {
        throw new Error("Tracking error");
      });

      const result = await sendTikTokEvent("123456789", "TestEvent", {});

      expect(result.success).toBe(false);
    });
  });
});
