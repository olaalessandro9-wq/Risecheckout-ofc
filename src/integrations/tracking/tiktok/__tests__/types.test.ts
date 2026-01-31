/**
 * @file types.test.ts
 * @description Tests for TikTok Pixel types validation
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import type {
  TikTokConfig,
  TikTokIntegration,
  TikTokItem,
  TikTokCustomer,
  TikTokConversionData,
  TikTokResponse,
} from "../types";

describe("TikTok Pixel Types", () => {
  describe("TikTokConfig", () => {
    it("should accept valid minimal config", () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      expect(config.pixel_id).toBe("123456789");
      expect(config.enabled).toBe(true);
    });

    it("should accept config with selected_products", () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: true,
        selected_products: ["prod_1", "prod_2"],
      };

      expect(config.selected_products).toHaveLength(2);
    });

    it("should accept disabled config", () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: false,
      };

      expect(config.enabled).toBe(false);
    });
  });

  describe("TikTokIntegration", () => {
    it("should accept valid integration data", () => {
      const integration: TikTokIntegration = {
        config: {
          pixel_id: "123456789",
          enabled: true,
        },
        active: true,
        integration_type: "TIKTOK_PIXEL",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(integration.integration_type).toBe("TIKTOK_PIXEL");
      expect(integration.active).toBe(true);
      expect(integration.vendor_id).toBe("vendor_123");
    });

    it("should accept inactive integration", () => {
      const integration: TikTokIntegration = {
        config: {
          pixel_id: "123456789",
          enabled: false,
        },
        active: false,
        integration_type: "TIKTOK_PIXEL",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(integration.active).toBe(false);
      expect(integration.config.enabled).toBe(false);
    });
  });

  describe("TikTokItem", () => {
    it("should accept valid item", () => {
      const item: TikTokItem = {
        id: "prod_123",
        name: "Test Product",
        price: 99.9,
        quantity: 1,
      };

      expect(item.id).toBe("prod_123");
      expect(item.name).toBe("Test Product");
      expect(item.price).toBe(99.9);
      expect(item.quantity).toBe(1);
    });

    it("should accept item with category", () => {
      const item: TikTokItem = {
        id: "prod_123",
        name: "Test Product",
        price: 99.9,
        quantity: 1,
        category: "Electronics",
      };

      expect(item.category).toBe("Electronics");
    });
  });

  describe("TikTokCustomer", () => {
    it("should accept customer with email only", () => {
      const customer: TikTokCustomer = {
        email: "test@example.com",
      };

      expect(customer.email).toBe("test@example.com");
    });

    it("should accept customer with all fields", () => {
      const customer: TikTokCustomer = {
        email: "test@example.com",
        phone: "+5511999999999",
        name: "Test User",
      };

      expect(customer.email).toBe("test@example.com");
      expect(customer.phone).toBe("+5511999999999");
      expect(customer.name).toBe("Test User");
    });
  });

  describe("TikTokConversionData", () => {
    it("should accept minimal conversion data", () => {
      const data: TikTokConversionData = {
        event_id: "event_123",
        timestamp: Date.now(),
        value: 99.9,
        currency: "BRL",
        event_type: "Purchase",
      };

      expect(data.event_id).toBe("event_123");
      expect(data.value).toBe(99.9);
      expect(data.currency).toBe("BRL");
      expect(data.event_type).toBe("Purchase");
    });

    it("should accept conversion data with all fields", () => {
      const data: TikTokConversionData = {
        event_id: "event_123",
        timestamp: Date.now(),
        value: 99.9,
        currency: "BRL",
        event_type: "Purchase",
        order_id: "order_456",
        items: [
          {
            id: "prod_1",
            name: "Product 1",
            price: 99.9,
            quantity: 1,
          },
        ],
        customer: {
          email: "test@example.com",
        },
      };

      expect(data.order_id).toBe("order_456");
      expect(data.items).toHaveLength(1);
      expect(data.customer?.email).toBe("test@example.com");
    });
  });

  describe("TikTokResponse", () => {
    it("should accept successful response", () => {
      const response: TikTokResponse = {
        success: true,
        message: "Event sent successfully",
      };

      expect(response.success).toBe(true);
      expect(response.message).toBe("Event sent successfully");
    });

    it("should accept error response", () => {
      const response: TikTokResponse = {
        success: false,
        message: "Error sending event",
        data: { error: "Network error" },
      };

      expect(response.success).toBe(false);
      expect(response.message).toBe("Error sending event");
      expect(response.data).toBeDefined();
    });
  });

  describe("Type Compatibility", () => {
    it("should allow TikTokItem in TikTokConversionData", () => {
      const item: TikTokItem = {
        id: "prod_1",
        name: "Product 1",
        price: 99.9,
        quantity: 1,
      };

      const data: TikTokConversionData = {
        event_id: "event_123",
        timestamp: Date.now(),
        value: 99.9,
        currency: "BRL",
        event_type: "Purchase",
        items: [item],
      };

      expect(data.items).toHaveLength(1);
      expect(data.items?.[0].id).toBe("prod_1");
    });

    it("should allow TikTokCustomer in TikTokConversionData", () => {
      const customer: TikTokCustomer = {
        email: "test@example.com",
        phone: "+5511999999999",
      };

      const data: TikTokConversionData = {
        event_id: "event_123",
        timestamp: Date.now(),
        value: 99.9,
        currency: "BRL",
        event_type: "Purchase",
        customer,
      };

      expect(data.customer?.email).toBe("test@example.com");
      expect(data.customer?.phone).toBe("+5511999999999");
    });

    it("should allow nested config in TikTokIntegration", () => {
      const config: TikTokConfig = {
        pixel_id: "123456789",
        enabled: true,
        selected_products: ["prod_1"],
      };

      const integration: TikTokIntegration = {
        config,
        active: true,
        integration_type: "TIKTOK_PIXEL",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(integration.config.selected_products).toHaveLength(1);
    });
  });
});
