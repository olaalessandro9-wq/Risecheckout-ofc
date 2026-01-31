/**
 * @file events.test.ts
 * @description Tests for Kwai Pixel events
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isValidKwaiConfig,
  sendKwaiEvent,
  trackPurchase,
  trackViewContent,
  trackAddToCart,
  trackPageView,
  trackLead,
} from "../events";
import type { KwaiConfig, KwaiItem, KwaiCustomer } from "../types";

const mockKwaiq = vi.fn();

describe("Kwai Pixel Events", () => {
  beforeEach(() => {
    (window as Record<string, unknown>).kwaiq = mockKwaiq;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as Record<string, unknown>).kwaiq;
  });

  describe("isValidKwaiConfig", () => {
    it("should return true for valid config", () => {
      const config: KwaiConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      expect(isValidKwaiConfig(config)).toBe(true);
    });

    it("should return false for config without pixel_id", () => {
      const config: KwaiConfig = {
        pixel_id: "",
        enabled: true,
      };

      expect(isValidKwaiConfig(config)).toBe(false);
    });
  });

  describe("sendKwaiEvent", () => {
    it("should send event with kwaiq function", async () => {
      const result = await sendKwaiEvent("123456789", "TestEvent", {
        value: 100,
        currency: "BRL",
      });

      expect(mockKwaiq).toHaveBeenCalledWith("TestEvent", expect.any(Object));
      expect(result.success).toBe(true);
    });

    it("should send event with kwaiq.track method", async () => {
      const mockTrack = vi.fn();
      (window as Record<string, unknown>).kwaiq = { track: mockTrack };

      const result = await sendKwaiEvent("123456789", "TestEvent", {
        value: 100,
        currency: "BRL",
      });

      expect(mockTrack).toHaveBeenCalledWith("TestEvent", expect.any(Object));
      expect(result.success).toBe(true);
    });

    it("should return error if pixel_id is empty", async () => {
      const result = await sendKwaiEvent("", "TestEvent", {});

      expect(result.success).toBe(false);
      expect(result.message).toContain("Pixel ID");
    });

    it("should return error if kwaiq is not available", async () => {
      delete (window as Record<string, unknown>).kwaiq;

      const result = await sendKwaiEvent("123456789", "TestEvent", {});

      expect(result.success).toBe(false);
      expect(result.message).toContain("kwaiq");
    });

    it("should include customer data in event", async () => {
      const customer: KwaiCustomer = {
        email: "test@example.com",
        phone: "+5511999999999",
        name: "Test User",
      };

      await sendKwaiEvent("123456789", "TestEvent", {
        customer,
      });

      expect(mockKwaiq).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({
          email: "test@example.com",
          phone_number: "+5511999999999",
          user_name: "Test User",
        })
      );
    });

    it("should include items in event", async () => {
      const items: KwaiItem[] = [
        {
          id: "prod_1",
          name: "Product 1",
          price: 99.9,
          quantity: 1,
        },
      ];

      await sendKwaiEvent("123456789", "TestEvent", {
        items,
      });

      expect(mockKwaiq).toHaveBeenCalledWith(
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
    it("should track PlaceOrder event", async () => {
      const config: KwaiConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const items: KwaiItem[] = [
        {
          id: "prod_1",
          name: "Product 1",
          price: 99.9,
          quantity: 1,
        },
      ];

      const result = await trackPurchase(config, "order_123", 99.9, items);

      expect(mockKwaiq).toHaveBeenCalledWith("PlaceOrder", expect.any(Object));
      expect(result.success).toBe(true);
    });

    it("should include order_id in PlaceOrder event", async () => {
      const config: KwaiConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      await trackPurchase(config, "order_456", 150.0);

      expect(mockKwaiq).toHaveBeenCalledWith(
        "PlaceOrder",
        expect.objectContaining({
          event_id: "purchase_order_456",
        })
      );
    });
  });

  describe("trackViewContent", () => {
    it("should track ViewContent event", async () => {
      const config: KwaiConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const item: KwaiItem = {
        id: "prod_1",
        name: "Product 1",
        price: 99.9,
        quantity: 1,
      };

      const result = await trackViewContent(config, item);

      expect(mockKwaiq).toHaveBeenCalledWith("ViewContent", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackAddToCart", () => {
    it("should track AddToCart event", async () => {
      const config: KwaiConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const items: KwaiItem[] = [
        {
          id: "prod_1",
          name: "Product 1",
          price: 99.9,
          quantity: 1,
        },
      ];

      const result = await trackAddToCart(config, items, 99.9);

      expect(mockKwaiq).toHaveBeenCalledWith("AddToCart", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackPageView", () => {
    it("should track PageView event", async () => {
      const config: KwaiConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const result = await trackPageView(config);

      expect(mockKwaiq).toHaveBeenCalledWith("PageView", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackLead", () => {
    it("should track Contact event", async () => {
      const config: KwaiConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const customer: KwaiCustomer = {
        email: "lead@example.com",
      };

      const result = await trackLead(config, customer);

      expect(mockKwaiq).toHaveBeenCalledWith("Contact", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle SSR environment", async () => {
      const originalWindow = global.window;
      delete (global as { window?: Window }).window;

      const result = await sendKwaiEvent("123456789", "TestEvent", {});

      expect(result.success).toBe(false);

      (global as { window?: Window }).window = originalWindow;
    });

    it("should handle errors during tracking", async () => {
      mockKwaiq.mockImplementationOnce(() => {
        throw new Error("Tracking error");
      });

      const result = await sendKwaiEvent("123456789", "TestEvent", {});

      expect(result.success).toBe(false);
    });

    it("should handle kwaiq without track method", async () => {
      (window as Record<string, unknown>).kwaiq = {};

      const result = await sendKwaiEvent("123456789", "TestEvent", {});

      expect(result.success).toBe(false);
      expect(result.message).toContain("rastreamento");
    });
  });
});
