/**
 * @file types.test.ts
 * @description Tests for Kwai Pixel types validation
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import type {
  KwaiConfig,
  KwaiIntegration,
  KwaiItem,
  KwaiCustomer,
  KwaiConversionData,
  KwaiResponse,
} from "../types";

describe("Kwai Pixel Types", () => {
  describe("KwaiConfig", () => {
    it("should accept valid minimal config", () => {
      const config: KwaiConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      expect(config.pixel_id).toBe("123456789");
      expect(config.enabled).toBe(true);
    });

    it("should accept config with selected_products", () => {
      const config: KwaiConfig = {
        pixel_id: "123456789",
        enabled: true,
        selected_products: ["prod_1", "prod_2"],
      };

      expect(config.selected_products).toHaveLength(2);
    });
  });

  describe("KwaiIntegration", () => {
    it("should accept valid integration data", () => {
      const integration: KwaiIntegration = {
        id: "integration_123",
        config: { pixel_id: "123456789", enabled: true },
        active: true,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(integration.id).toBe("integration_123");
      expect(integration.active).toBe(true);
    });
  });

  describe("KwaiItem", () => {
    it("should accept valid item", () => {
      const item: KwaiItem = {
        id: "prod_123",
        name: "Test Product",
        price: 99.9,
        quantity: 1,
      };

      expect(item.id).toBe("prod_123");
      expect(item.name).toBe("Test Product");
    });
  });

  describe("KwaiCustomer", () => {
    it("should accept customer with all fields", () => {
      const customer: KwaiCustomer = {
        email: "test@example.com",
        phone: "+5511999999999",
        name: "Test User",
      };

      expect(customer.email).toBe("test@example.com");
      expect(customer.phone).toBe("+5511999999999");
    });
  });

  describe("KwaiConversionData", () => {
    it("should accept minimal conversion data", () => {
      const data: KwaiConversionData = {
        event_id: "event_123",
        timestamp: Date.now(),
        value: 99.9,
        currency: "BRL",
        event_type: "PlaceOrder",
      };

      expect(data.event_id).toBe("event_123");
      expect(data.value).toBe(99.9);
    });
  });

  describe("KwaiResponse", () => {
    it("should accept successful response", () => {
      const response: KwaiResponse = {
        success: true,
        message: "Event sent successfully",
      };

      expect(response.success).toBe(true);
    });

    it("should accept error response", () => {
      const response: KwaiResponse = {
        success: false,
        message: "Error sending event",
        data: { error: "Network error" },
      };

      expect(response.success).toBe(false);
    });
  });
});
