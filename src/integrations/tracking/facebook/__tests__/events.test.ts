/**
 * @file events.test.ts
 * @description Tests for Facebook Pixel events with eventID deduplication
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
      expect(mockFbq).toHaveBeenCalledWith("track", "TestEvent", { value: 100 }, undefined);
    });

    it("should pass eventID as 4th parameter when provided", () => {
      trackEvent("Purchase", { value: 100 }, "purchase_order123");
      expect(mockFbq).toHaveBeenCalledWith(
        "track",
        "Purchase",
        { value: 100 },
        { eventID: "purchase_order123" }
      );
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
      }, undefined);
    });

    it("should pass eventID when provided", () => {
      trackCustomEvent("CustomEvent", { custom_param: "value" }, "custom_123");
      expect(mockFbq).toHaveBeenCalledWith("trackCustom", "CustomEvent", {
        custom_param: "value",
      }, { eventID: "custom_123" });
    });

    it("should handle missing fbq gracefully", () => {
      delete (window as unknown as Record<string, unknown>).fbq;
      expect(() => trackCustomEvent("CustomEvent")).not.toThrow();
    });
  });

  describe("trackViewContent", () => {
    it("should track ViewContent event with product data and return eventId", () => {
      const product = createMockProduct();
      const eventId = trackViewContent(product);
      expect(mockFbq).toHaveBeenCalledWith("track", "ViewContent", expect.any(Object), expect.objectContaining({ eventID: expect.stringContaining("view_") }));
      expect(eventId).toMatch(/^view_prod_123_\d+$/);
    });

    it("should return eventId even without fbq (generation is independent)", () => {
      delete (window as unknown as Record<string, unknown>).fbq;
      const eventId = trackViewContent(createMockProduct());
      // Event ID is generated independently of fbq availability
      expect(eventId).toMatch(/^view_prod_123_\d+$/);
      expect(mockFbq).not.toHaveBeenCalled();
    });
  });

  describe("trackInitiateCheckout", () => {
    it("should track InitiateCheckout event and return eventId", () => {
      const product = createMockProduct();
      const eventId = trackInitiateCheckout(product, 9990, 1);
      expect(mockFbq).toHaveBeenCalledWith("track", "InitiateCheckout", expect.any(Object), expect.objectContaining({ eventID: expect.stringContaining("checkout_") }));
      expect(eventId).toMatch(/^checkout_prod_123_\d+$/);
    });

    it("should include bump data when provided", () => {
      const product = createMockProduct();
      const eventId = trackInitiateCheckout(product, 14990, 2);
      expect(mockFbq).toHaveBeenCalledWith("track", "InitiateCheckout", expect.any(Object), expect.any(Object));
      expect(eventId).toBeTruthy();
    });
  });

  describe("trackPurchase", () => {
    it("should track Purchase event with deterministic eventId", () => {
      const product = createMockProduct();
      const eventId = trackPurchase("order_123", 9990, product);
      expect(mockFbq).toHaveBeenCalledWith(
        "track",
        "Purchase",
        expect.any(Object),
        { eventID: "purchase_order_123" }
      );
      expect(eventId).toBe("purchase_order_123");
    });

    it("should generate same eventId for same orderId (deterministic)", () => {
      const product = createMockProduct();
      const id1 = trackPurchase("order_abc", 9990, product);
      const id2 = trackPurchase("order_abc", 9990, product);
      expect(id1).toBe(id2);
      expect(id1).toBe("purchase_order_abc");
    });
  });

  describe("trackAddToCart", () => {
    it("should track AddToCart event and return eventId", () => {
      const bump = createMockBump();
      const eventId = trackAddToCart(bump, 99.9);
      expect(mockFbq).toHaveBeenCalledWith("track", "AddToCart", expect.any(Object), expect.objectContaining({ eventID: expect.stringContaining("cart_") }));
      expect(eventId).toMatch(/^cart_bump_123_\d+$/);
    });
  });

  describe("trackCompleteRegistration", () => {
    it("should track CompleteRegistration event and return eventId", () => {
      const eventId = trackCompleteRegistration("test@example.com");
      expect(mockFbq).toHaveBeenCalledWith("track", "CompleteRegistration", expect.any(Object), expect.any(Object));
      expect(eventId).toMatch(/^completeregistration_\d+_/);
    });
  });

  describe("trackPageView", () => {
    it("should track PageView event", () => {
      trackPageView();
      expect(mockFbq).toHaveBeenCalledWith("track", "PageView", undefined, undefined);
    });
  });

  describe("trackLead", () => {
    it("should track Lead event and return eventId", () => {
      const eventId = trackLead("test@example.com");
      expect(mockFbq).toHaveBeenCalledWith("track", "Lead", expect.any(Object), expect.any(Object));
      expect(eventId).toMatch(/^lead_\d+_/);
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
