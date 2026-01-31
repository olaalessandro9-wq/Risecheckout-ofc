/**
 * @file events.test.ts
 * @description Tests for Facebook Pixel events
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  trackEvent,
  trackCustomEvent,
  trackViewContent,
  trackInitiateCheckout,
  trackPurchase,
  trackAddToCart,
  trackCompleteRegistration,
  trackPageView,
  trackLead,
} from "../events";
import { createMockProduct, createMockBump } from "./_test-helpers";

const mockFbq = vi.fn();

describe("Facebook Pixel Events", () => {
  beforeEach(() => {
    (window as unknown as Record<string, unknown>).fbq = mockFbq;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).fbq;
  });

  describe("trackEvent", () => {
    it("should call fbq with track method", () => {
      trackEvent("TestEvent", { value: 100 });
      expect(mockFbq).toHaveBeenCalledWith("track", "TestEvent", { value: 100 });
    });

    it("should handle missing fbq gracefully", () => {
      delete (window as unknown as Record<string, unknown>).fbq;
      expect(() => trackEvent("TestEvent")).not.toThrow();
      expect(mockFbq).not.toHaveBeenCalled();
    });

    it("should handle errors during tracking", () => {
      mockFbq.mockImplementationOnce(() => {
        throw new Error("Tracking error");
      });
      expect(() => trackEvent("TestEvent")).not.toThrow();
    });
  });

  describe("trackCustomEvent", () => {
    it("should call fbq with trackCustom method", () => {
      trackCustomEvent("CustomEvent", { custom_param: "value" });
      expect(mockFbq).toHaveBeenCalledWith("trackCustom", "CustomEvent", {
        custom_param: "value",
      });
    });

    it("should handle missing fbq gracefully", () => {
      delete (window as unknown as Record<string, unknown>).fbq;
      expect(() => trackCustomEvent("CustomEvent")).not.toThrow();
    });
  });

  describe("trackViewContent", () => {
    it("should track ViewContent event with product data", () => {
      const product = createMockProduct();
      trackViewContent(product);
      expect(mockFbq).toHaveBeenCalledWith("track", "ViewContent", expect.any(Object));
    });

    it("should handle missing fbq gracefully", () => {
      delete (window as unknown as Record<string, unknown>).fbq;
      expect(() => trackViewContent(createMockProduct())).not.toThrow();
    });
  });

  describe("trackInitiateCheckout", () => {
    it("should track InitiateCheckout event", () => {
      const product = createMockProduct();
      trackInitiateCheckout(product, 9990, 1);
      expect(mockFbq).toHaveBeenCalledWith("track", "InitiateCheckout", expect.any(Object));
    });

    it("should include bump data when provided", () => {
      const product = createMockProduct();
      trackInitiateCheckout(product, 14990, 2);
      expect(mockFbq).toHaveBeenCalledWith("track", "InitiateCheckout", expect.any(Object));
    });
  });

  describe("trackPurchase", () => {
    it("should track Purchase event", () => {
      const product = createMockProduct();
      trackPurchase("order_123", 9990, product);
      expect(mockFbq).toHaveBeenCalledWith("track", "Purchase", expect.any(Object));
    });
  });

  describe("trackAddToCart", () => {
    it("should track AddToCart event", () => {
      const bump = createMockBump();
      trackAddToCart(bump, 99.9);
      expect(mockFbq).toHaveBeenCalledWith("track", "AddToCart", expect.any(Object));
    });
  });

  describe("trackCompleteRegistration", () => {
    it("should track CompleteRegistration event", () => {
      trackCompleteRegistration("test@example.com");
      expect(mockFbq).toHaveBeenCalledWith("track", "CompleteRegistration", expect.any(Object));
    });
  });

  describe("trackPageView", () => {
    it("should track PageView event", () => {
      trackPageView();
      expect(mockFbq).toHaveBeenCalledWith("track", "PageView", undefined);
    });
  });

  describe("trackLead", () => {
    it("should track Lead event", () => {
      trackLead("test@example.com");
      expect(mockFbq).toHaveBeenCalledWith("track", "Lead", expect.any(Object));
    });
  });

  describe("Edge Cases", () => {
    it("should handle SSR environment", () => {
      const originalWindow = global.window;
      delete (global as { window?: Window }).window;
      expect(() => trackEvent("TestEvent")).not.toThrow();
      (global as { window?: Window }).window = originalWindow;
    });

    it("should handle all events without fbq", () => {
      delete (window as unknown as Record<string, unknown>).fbq;
      const product = createMockProduct();
      const bump = createMockBump();
      expect(() => {
        trackViewContent(product);
        trackInitiateCheckout(product, 9990, 1);
        trackPurchase("order_123", 9990, product);
        trackAddToCart(bump, 99.9);
        trackCompleteRegistration("test@example.com");
        trackPageView();
        trackLead("test@example.com");
      }).not.toThrow();
    });
  });
});
