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
import { createMockConfig, createMockItem, createMockCustomer } from "./_test-helpers";

const mockTtq = { track: vi.fn() };

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
      const config = createMockConfig();
      expect(isValidTikTokConfig(config)).toBe(true);
    });

    it("should return false for config without pixel_id", () => {
      const config = createMockConfig({ pixel_id: "" });
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

    it("should include customer and items data", async () => {
      const customer = createMockCustomer();
      const items = [createMockItem()];
      await sendTikTokEvent("123456789", "TestEvent", { customer, items });
      expect(mockTtq.track).toHaveBeenCalledWith("TestEvent", expect.any(Object));
    });
  });

  describe("trackPurchase", () => {
    it("should track Purchase event", async () => {
      const config = createMockConfig();
      const items = [createMockItem()];
      const result = await trackPurchase(config, "order_123", 99.9, items);
      expect(mockTtq.track).toHaveBeenCalledWith("Purchase", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackViewContent", () => {
    it("should track ViewContent event", async () => {
      const config = createMockConfig();
      const item = createMockItem();
      const result = await trackViewContent(config, item);
      expect(mockTtq.track).toHaveBeenCalledWith("ViewContent", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackAddToCart", () => {
    it("should track AddToCart event", async () => {
      const config = createMockConfig();
      const items = [createMockItem()];
      const result = await trackAddToCart(config, items, 99.9);
      expect(mockTtq.track).toHaveBeenCalledWith("AddToCart", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackPageView", () => {
    it("should track PageView event", async () => {
      const config = createMockConfig();
      const result = await trackPageView(config);
      expect(mockTtq.track).toHaveBeenCalledWith("PageView", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackLead", () => {
    it("should track Contact event", async () => {
      const config = createMockConfig();
      const customer = createMockCustomer();
      const result = await trackLead(config, customer);
      expect(mockTtq.track).toHaveBeenCalledWith("Contact", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackInitiateCheckout", () => {
    it("should track InitiateCheckout event", async () => {
      const config = createMockConfig();
      const items = [createMockItem()];
      const result = await trackInitiateCheckout(config, items, 99.9);
      expect(mockTtq.track).toHaveBeenCalledWith("InitiateCheckout", expect.any(Object));
      expect(result.success).toBe(true);
    });
  });

  describe("trackRefund", () => {
    it("should track Refund event", async () => {
      const config = createMockConfig();
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
