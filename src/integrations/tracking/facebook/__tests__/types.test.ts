/**
 * @file types.test.ts
 * @description Tests for Facebook Pixel types validation
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import type {
  FacebookPixelConfig,
  FacebookEventParams,
  VendorIntegrationData,
  TrackingPropertyValue,
} from "../types";

describe("Facebook Pixel Types", () => {
  describe("FacebookPixelConfig", () => {
    it("should accept valid minimal config", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      expect(config.pixel_id).toBe("123456789");
      expect(config.enabled).toBe(true);
    });

    it("should accept config with all optional fields", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
        access_token: "test_token",
        selected_products: ["prod_1", "prod_2"],
        fire_purchase_on_pix: true,
      };

      expect(config.access_token).toBe("test_token");
      expect(config.selected_products).toHaveLength(2);
      expect(config.fire_purchase_on_pix).toBe(true);
    });

    it("should accept disabled config", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: false,
      };

      expect(config.enabled).toBe(false);
    });
  });

  describe("FacebookEventParams", () => {
    it("should accept standard event parameters", () => {
      const params: FacebookEventParams = {
        content_name: "Test Product",
        content_ids: ["prod_123"],
        content_type: "product",
        value: 99.9,
        currency: "BRL",
        num_items: 1,
        transaction_id: "order_456",
      };

      expect(params.content_name).toBe("Test Product");
      expect(params.content_ids).toEqual(["prod_123"]);
      expect(params.value).toBe(99.9);
    });

    it("should accept empty params object", () => {
      const params: FacebookEventParams = {};

      expect(Object.keys(params)).toHaveLength(0);
    });

    it("should accept custom properties", () => {
      const params: FacebookEventParams = {
        content_name: "Test",
        custom_field: "custom_value",
        another_field: 123,
      };

      expect(params.custom_field).toBe("custom_value");
      expect(params.another_field).toBe(123);
    });

    it("should accept multiple content_ids", () => {
      const params: FacebookEventParams = {
        content_ids: ["prod_1", "prod_2", "prod_3"],
      };

      expect(params.content_ids).toHaveLength(3);
    });
  });

  describe("TrackingPropertyValue", () => {
    it("should accept string values", () => {
      const value: TrackingPropertyValue = "test_string";

      expect(typeof value).toBe("string");
    });

    it("should accept number values", () => {
      const value: TrackingPropertyValue = 123;

      expect(typeof value).toBe("number");
    });

    it("should accept boolean values", () => {
      const value: TrackingPropertyValue = true;

      expect(typeof value).toBe("boolean");
    });

    it("should accept null values", () => {
      const value: TrackingPropertyValue = null;

      expect(value).toBeNull();
    });

    it("should accept undefined values", () => {
      const value: TrackingPropertyValue = undefined;

      expect(value).toBeUndefined();
    });
  });

  describe("VendorIntegrationData", () => {
    it("should accept valid integration data", () => {
      const data: VendorIntegrationData = {
        config: {
          pixel_id: "123456789",
          enabled: true,
        },
        active: true,
        integration_type: "FACEBOOK_PIXEL",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(data.integration_type).toBe("FACEBOOK_PIXEL");
      expect(data.active).toBe(true);
      expect(data.vendor_id).toBe("vendor_123");
    });

    it("should accept inactive integration", () => {
      const data: VendorIntegrationData = {
        config: {
          pixel_id: "123456789",
          enabled: false,
        },
        active: false,
        integration_type: "FACEBOOK_PIXEL",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(data.active).toBe(false);
      expect(data.config.enabled).toBe(false);
    });
  });

  describe("Type Compatibility", () => {
    it("should allow FacebookEventParams with TrackingPropertyValue", () => {
      const customValue: TrackingPropertyValue = "test";
      const params: FacebookEventParams = {
        custom_field: customValue,
      };

      expect(params.custom_field).toBe("test");
    });

    it("should allow nested config in VendorIntegrationData", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
        fire_purchase_on_pix: true,
      };

      const data: VendorIntegrationData = {
        config,
        active: true,
        integration_type: "FACEBOOK_PIXEL",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(data.config.fire_purchase_on_pix).toBe(true);
    });
  });
});
