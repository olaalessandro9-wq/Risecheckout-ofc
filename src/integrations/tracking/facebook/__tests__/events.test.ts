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
import type { TrackableProduct, TrackableBump } from "@/types/tracking.types";

const mockFbq = vi.fn();

describe("Facebook Pixel Events", () => {
  beforeEach(() => {
    (window as Record<string, unknown>).fbq = mockFbq;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as Record<string, unknown>).fbq;
  });

  describe("trackEvent", () => {
    it("should call fbq with track method", () => {
      trackEvent("TestEvent", { value: 100 });

      expect(mockFbq).toHaveBeenCalledWith("track", "TestEvent", { value: 100 });
    });

    it("should handle missing fbq gracefully", () => {
      delete (window as Record<string, unknown>).fbq;

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
      delete (window as Record<string, unknown>).fbq;

      expect(() => trackCustomEvent("CustomEvent")).not.toThrow();
    });
  });

  describe("trackViewContent", () => {
    it("should track ViewContent event with product data", () => {
      const product: TrackableProduct = {
        id: "prod_123",
        name: "Test Product",
        price: 99.9,
      };

      trackViewContent(product);

      expect(mockFbq).toHaveBeenCalledWith("track", "ViewContent", {
        content_name: "Test Product",
        content_ids: ["prod_123"],
        content_type: "product",
        value: 99.9,
        currency: "BRL",
      });
    });

    it("should handle product without name", () => {
      const product: TrackableProduct = {
        id: "prod_123",
        name: "",
        price: 99.9,
      };

      trackViewContent(product);

      expect(mockFbq).toHaveBeenCalledWith("track", "ViewContent", {
        content_name: "Produto Desconhecido",
        content_ids: ["prod_123"],
        content_type: "product",
        value: 99.9,
        currency: "BRL",
      });
    });

    it("should not track with invalid product", () => {
      trackViewContent(null as unknown as TrackableProduct);

      expect(mockFbq).not.toHaveBeenCalled();
    });
  });

  describe("trackInitiateCheckout", () => {
    it("should track InitiateCheckout with correct parameters", () => {
      const product: TrackableProduct = {
        id: "prod_123",
        name: "Test Product",
        price: 99.9,
      };

      trackInitiateCheckout(product, 149.9, 2);

      expect(mockFbq).toHaveBeenCalledWith("track", "InitiateCheckout", {
        content_name: "Test Product",
        content_ids: ["prod_123"],
        value: 149.9,
        currency: "BRL",
        num_items: 2,
      });
    });

    it("should not track with invalid product", () => {
      trackInitiateCheckout(null as unknown as TrackableProduct, 100, 1);

      expect(mockFbq).not.toHaveBeenCalled();
    });
  });

  describe("trackPurchase", () => {
    it("should track Purchase event with order data", () => {
      const product: TrackableProduct = {
        id: "prod_123",
        name: "Test Product",
        price: 99.9,
      };

      trackPurchase("order_456", 9990, product);

      expect(mockFbq).toHaveBeenCalledWith("track", "Purchase", {
        content_name: "Test Product",
        content_ids: ["prod_123"],
        value: 99.9,
        currency: "BRL",
        transaction_id: "order_456",
      });
    });

    it("should include additional parameters", () => {
      const product: TrackableProduct = {
        id: "prod_123",
        name: "Test Product",
        price: 99.9,
      };

      trackPurchase("order_456", 9990, product, { num_items: 3 });

      expect(mockFbq).toHaveBeenCalledWith("track", "Purchase", {
        content_name: "Test Product",
        content_ids: ["prod_123"],
        value: 99.9,
        currency: "BRL",
        transaction_id: "order_456",
        num_items: 3,
      });
    });

    it("should not track with invalid data", () => {
      trackPurchase("", 100, null as unknown as TrackableProduct);

      expect(mockFbq).not.toHaveBeenCalled();
    });
  });

  describe("trackAddToCart", () => {
    it("should track AddToCart event with bump data", () => {
      const bump: TrackableBump = {
        id: "bump_789",
        name: "Bonus Pack",
        price: 49.9,
      };

      trackAddToCart(bump, 149.8);

      expect(mockFbq).toHaveBeenCalledWith("track", "AddToCart", {
        content_name: "Bonus Pack",
        content_ids: ["bump_789"],
        value: 149.8,
        currency: "BRL",
      });
    });

    it("should handle bump without name", () => {
      const bump: TrackableBump = {
        id: "bump_789",
        name: "",
        price: 49.9,
      };

      trackAddToCart(bump, 149.8);

      expect(mockFbq).toHaveBeenCalledWith("track", "AddToCart", {
        content_name: "Produto Adicional",
        content_ids: ["bump_789"],
        value: 149.8,
        currency: "BRL",
      });
    });

    it("should not track with invalid bump", () => {
      trackAddToCart(null as unknown as TrackableBump, 100);

      expect(mockFbq).not.toHaveBeenCalled();
    });
  });

  describe("trackCompleteRegistration", () => {
    it("should track CompleteRegistration with email", () => {
      trackCompleteRegistration("test@example.com");

      expect(mockFbq).toHaveBeenCalledWith("track", "CompleteRegistration", {
        content_name: "Checkout Form",
      });
    });

    it("should include phone if provided", () => {
      trackCompleteRegistration("test@example.com", "+5511999999999");

      expect(mockFbq).toHaveBeenCalledWith("track", "CompleteRegistration", {
        content_name: "Checkout Form",
        phone: "+5511999999999",
      });
    });

    it("should not track with invalid email", () => {
      trackCompleteRegistration("");

      expect(mockFbq).not.toHaveBeenCalled();
    });
  });

  describe("trackPageView", () => {
    it("should track PageView event", () => {
      trackPageView();

      expect(mockFbq).toHaveBeenCalledWith("track", "PageView", undefined);
    });
  });

  describe("trackLead", () => {
    it("should track Lead event with email", () => {
      trackLead("lead@example.com");

      expect(mockFbq).toHaveBeenCalledWith("track", "Lead", {
        content_name: "Lead Capturado",
      });
    });

    it("should include source if provided", () => {
      trackLead("lead@example.com", "landing-page");

      expect(mockFbq).toHaveBeenCalledWith("track", "Lead", {
        content_name: "Lead Capturado",
        source: "landing-page",
      });
    });

    it("should not track with invalid email", () => {
      trackLead("");

      expect(mockFbq).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle SSR environment", () => {
      const originalWindow = global.window;
      delete (global as { window?: Window }).window;

      expect(() => trackEvent("TestEvent")).not.toThrow();

      (global as { window?: Window }).window = originalWindow;
    });

    it("should handle custom parameters in events", () => {
      trackEvent("CustomEvent", {
        custom_field: "custom_value",
        another_field: 123,
      });

      expect(mockFbq).toHaveBeenCalledWith("track", "CustomEvent", {
        custom_field: "custom_value",
        another_field: 123,
      });
    });
  });
});
