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

describe("Google Ads Types", () => {
  describe("GoogleAdsConfig", () => {
    it("should accept valid minimal config", () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
      };

      expect(config.conversion_id).toBe("AW-123456789");
    });

    it("should accept config with conversion_label", () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        conversion_label: "test_label",
      };

      expect(config.conversion_label).toBe("test_label");
    });

    it("should accept config with event_labels", () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        event_labels: [
          { eventType: "purchase", label: "purchase_label", enabled: true },
        ],
      };

      expect(config.event_labels).toHaveLength(1);
    });

    it("should accept config with selected_products", () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        selected_products: ["prod_1", "prod_2"],
      };

      expect(config.selected_products).toHaveLength(2);
    });
  });

  describe("GoogleAdsIntegration", () => {
    it("should accept valid integration data", () => {
      const integration: GoogleAdsIntegration = {
        config: {
          conversion_id: "AW-123456789",
          conversion_label: "test_label",
        },
        active: true,
        integration_type: "GOOGLE_ADS",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(integration.integration_type).toBe("GOOGLE_ADS");
      expect(integration.active).toBe(true);
      expect(integration.vendor_id).toBe("vendor_123");
    });

    it("should accept inactive integration", () => {
      const integration: GoogleAdsIntegration = {
        config: {
          conversion_id: "AW-123456789",
        },
        active: false,
        integration_type: "GOOGLE_ADS",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(integration.active).toBe(false);
    });
  });

  describe("GoogleAdsItem", () => {
    it("should accept valid item", () => {
      const item: GoogleAdsItem = {
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
      const item: GoogleAdsItem = {
        id: "prod_123",
        name: "Test Product",
        price: 99.9,
        quantity: 1,
        category: "Electronics",
      };

      expect(item.category).toBe("Electronics");
    });
  });

  describe("GoogleAdsCustomer", () => {
    it("should accept customer with hashed data", () => {
      const customer: GoogleAdsCustomer = {
        email_hash: "hashed_email",
        phone_hash: "hashed_phone",
      };

      expect(customer.email_hash).toBe("hashed_email");
      expect(customer.phone_hash).toBe("hashed_phone");
    });

    it("should accept customer with address data", () => {
      const customer: GoogleAdsCustomer = {
        email_hash: "hashed_email",
        address: "123 Main St",
        city: "São Paulo",
        state: "SP",
        zip_code: "01234-567",
        country: "BR",
      };

      expect(customer.address).toBe("123 Main St");
      expect(customer.city).toBe("São Paulo");
      expect(customer.state).toBe("SP");
      expect(customer.zip_code).toBe("01234-567");
      expect(customer.country).toBe("BR");
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
      expect(data.conversionValue).toBe(99.9);
      expect(data.currencyCode).toBe("BRL");
      expect(data.conversionLabel).toBe("test_label");
      expect(data.eventType).toBe("purchase");
    });

    it("should accept conversion data with all fields", () => {
      const data: GoogleAdsConversionData = {
        conversionId: "AW-123456789",
        conversionTimestamp: Math.floor(Date.now() / 1000),
        conversionValue: 99.9,
        currencyCode: "BRL",
        conversionLabel: "test_label",
        orderId: "order_456",
        items: [
          {
            id: "prod_1",
            name: "Product 1",
            price: 99.9,
            quantity: 1,
          },
        ],
        customer: {
          email_hash: "hashed_email",
        },
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
      expect(response.message).toBe("Conversion sent successfully");
    });

    it("should accept error response", () => {
      const response: GoogleAdsResponse = {
        success: false,
        message: "Error sending conversion",
        data: { error: "Network error" },
      };

      expect(response.success).toBe(false);
      expect(response.message).toBe("Error sending conversion");
      expect(response.data).toBeDefined();
    });
  });

  describe("GoogleAdsEventLabel", () => {
    it("should accept valid event label", () => {
      const eventLabel: GoogleAdsEventLabel = {
        eventType: "purchase",
        label: "purchase_label",
        enabled: true,
      };

      expect(eventLabel.eventType).toBe("purchase");
      expect(eventLabel.label).toBe("purchase_label");
      expect(eventLabel.enabled).toBe(true);
    });

    it("should accept disabled event label", () => {
      const eventLabel: GoogleAdsEventLabel = {
        eventType: "lead",
        label: "lead_label",
        enabled: false,
      };

      expect(eventLabel.enabled).toBe(false);
    });
  });

  describe("Type Compatibility", () => {
    it("should allow GoogleAdsItem in GoogleAdsConversionData", () => {
      const item: GoogleAdsItem = {
        id: "prod_1",
        name: "Product 1",
        price: 99.9,
        quantity: 1,
      };

      const data: GoogleAdsConversionData = {
        conversionId: "AW-123456789",
        conversionTimestamp: Math.floor(Date.now() / 1000),
        conversionValue: 99.9,
        currencyCode: "BRL",
        conversionLabel: "test_label",
        items: [item],
        eventType: "purchase",
      };

      expect(data.items).toHaveLength(1);
      expect(data.items?.[0].id).toBe("prod_1");
    });

    it("should allow GoogleAdsCustomer in GoogleAdsConversionData", () => {
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
        customer,
        eventType: "purchase",
      };

      expect(data.customer?.email_hash).toBe("hashed_email");
      expect(data.customer?.phone_hash).toBe("hashed_phone");
    });

    it("should allow nested config in GoogleAdsIntegration", () => {
      const config: GoogleAdsConfig = {
        conversion_id: "AW-123456789",
        conversion_label: "test_label",
        event_labels: [
          { eventType: "purchase", label: "purchase_label", enabled: true },
        ],
      };

      const integration: GoogleAdsIntegration = {
        config,
        active: true,
        integration_type: "GOOGLE_ADS",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(integration.config.event_labels).toHaveLength(1);
    });
  });
});
