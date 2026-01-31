/**
 * @file types.test.ts
 * @description Tests for Google Ads types validation
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import type {
  GoogleAdsConfig,
  GoogleAdsIntegration,
  GoogleAdsItem,
  GoogleAdsCustomer,
  GoogleAdsConversionData,
  GoogleAdsResponse,
  GoogleAdsEventLabel,
} from "../types";
import { createMockIntegration } from "./_test-helpers";

describe("Google Ads Types", () => {
  describe("GoogleAdsConfig", () => {
    it("should accept valid minimal config", () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        enabled: true,
      };
      expect(config.conversion_id).toBe("AW-123456789");
      expect(config.enabled).toBe(true);
    });

    it("should accept config with all optional fields", () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        conversion_label: "test_label",
        event_labels: [
          { eventType: "purchase", label: "purchase_label", enabled: true },
        ],
        selected_products: ["prod_1", "prod_2"],
        enabled: true,
      };
      expect(config.conversion_label).toBe("test_label");
      expect(config.event_labels).toHaveLength(1);
      expect(config.selected_products).toHaveLength(2);
    });
  });

  describe("GoogleAdsIntegration", () => {
    it("should accept valid integration data", () => {
      const integration = createMockIntegration();
      expect(integration.id).toBe("integration_123");
      expect(integration.active).toBe(true);
      expect(integration.vendor_id).toBe("vendor_123");
    });

    it("should accept inactive integration", () => {
      const integration = createMockIntegration({ active: false });
      expect(integration.active).toBe(false);
    });
  });

  describe("GoogleAdsItem", () => {
    it("should accept valid item with all fields", () => {
      const item: GoogleAdsItem = {
        id: "prod_123",
        name: "Test Product",
        price: 99.9,
        quantity: 1,
        category: "Electronics",
      };
      expect(item.id).toBe("prod_123");
      expect(item.category).toBe("Electronics");
    });
  });

  describe("GoogleAdsCustomer", () => {
    it("should accept customer with all fields", () => {
      const customer: GoogleAdsCustomer = {
        email_hash: "hashed_email",
        phone_hash: "hashed_phone",
        address: "123 Main St",
        city: "São Paulo",
        state: "SP",
        zip_code: "01234-567",
        country: "BR",
      };
      expect(customer.email_hash).toBe("hashed_email");
      expect(customer.city).toBe("São Paulo");
    });
  });

  describe("GoogleAdsConversionData", () => {
    it("should accept minimal conversion data", () => {
      const data: GoogleAdsConversionData = {
        conversionId: "AW-123456789",
        conversionTimestamp: Math.floor(Date.now() / 1000),
        conversionValue: 99.9,
        currencyCode: "BRL",
        conversionLabel: "test_label",
        eventType: "purchase",
      };
      expect(data.conversionId).toBe("AW-123456789");
      expect(data.currencyCode).toBe("BRL");
    });

    it("should accept conversion data with all optional fields", () => {
      const data: GoogleAdsConversionData = {
        conversionId: "AW-123456789",
        conversionTimestamp: Math.floor(Date.now() / 1000),
        conversionValue: 99.9,
        currencyCode: "BRL",
        conversionLabel: "test_label",
        orderId: "order_456",
        items: [{ id: "prod_1", name: "Product 1", price: 99.9, quantity: 1 }],
        customer: { email_hash: "hashed_email" },
        eventType: "purchase",
      };
      expect(data.orderId).toBe("order_456");
      expect(data.items).toHaveLength(1);
      expect(data.customer?.email_hash).toBe("hashed_email");
    });
  });

  describe("GoogleAdsResponse", () => {
    it("should accept successful response", () => {
      const response: GoogleAdsResponse = {
        success: true,
        message: "Conversion sent successfully",
      };
      expect(response.success).toBe(true);
    });

    it("should accept error response", () => {
      const response: GoogleAdsResponse = {
        success: false,
        message: "Error sending conversion",
        data: { error: "Network error" },
      };
      expect(response.success).toBe(false);
      expect(response.data).toBeDefined();
    });
  });

  describe("GoogleAdsEventLabel", () => {
    it("should accept valid event labels", () => {
      const eventLabel: GoogleAdsEventLabel = {
        eventType: "purchase",
        label: "purchase_label",
        enabled: true,
      };
      expect(eventLabel.eventType).toBe("purchase");
      expect(eventLabel.enabled).toBe(true);
    });
  });

  describe("Type Compatibility", () => {
    it("should allow nested structures", () => {
      const item: GoogleAdsItem = {
        id: "prod_1",
        name: "Product 1",
        price: 99.9,
        quantity: 1,
      };
      const customer: GoogleAdsCustomer = {
        email_hash: "hashed_email",
        phone_hash: "hashed_phone",
      };
      const data: GoogleAdsConversionData = {
        conversionId: "AW-123456789",
        conversionTimestamp: Math.floor(Date.now() / 1000),
        conversionValue: 99.9,
        currencyCode: "BRL",
        conversionLabel: "test_label",
        items: [item],
        customer,
        eventType: "purchase",
      };
      expect(data.items?.[0].id).toBe("prod_1");
      expect(data.customer?.email_hash).toBe("hashed_email");
    });

    it("should allow config in integration", () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        event_labels: [
          { eventType: "purchase", label: "purchase_label", enabled: true },
        ],
        enabled: true,
      };
      const integration = createMockIntegration({ config });
      expect(integration.config.event_labels).toHaveLength(1);
    });
  });
});
