/**
 * @file types.test.ts
 * @description Tests for UTMify types validation
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import type {
  UTMParameters,
  UTMifyConfig,
  UTMifyIntegration,
  UTMifyEventData,
  UTMifyResponse,
} from "../types";

describe("UTMify Types", () => {
  describe("UTMParameters", () => {
    it("should accept all UTM parameters", () => {
      const params: UTMParameters = {
        src: "fb",
        sck: "123",
        utm_source: "google",
        utm_campaign: "summer",
        utm_medium: "cpc",
        utm_content: "ad1",
        utm_term: "shoes",
      };

      expect(params.utm_source).toBe("google");
      expect(params.utm_campaign).toBe("summer");
      expect(params.src).toBe("fb");
    });

    it("should accept null values", () => {
      const params: UTMParameters = {
        src: null,
        sck: null,
        utm_source: null,
        utm_campaign: null,
        utm_medium: null,
        utm_content: null,
        utm_term: null,
      };

      expect(params.utm_source).toBeNull();
      expect(params.src).toBeNull();
    });
  });

  describe("UTMifyConfig", () => {
    it("should accept valid config", () => {
      const config: UTMifyConfig = {
        api_key: "test_api_key",
        enabled: true,
      };

      expect(config.api_key).toBe("test_api_key");
      expect(config.enabled).toBe(true);
    });

    it("should accept disabled config", () => {
      const config: UTMifyConfig = {
        api_key: "test_api_key",
        enabled: false,
      };

      expect(config.enabled).toBe(false);
    });
  });

  describe("UTMifyIntegration", () => {
    it("should accept valid integration data", () => {
      const integration: UTMifyIntegration = {
        config: {
          api_key: "test_api_key",
          enabled: true,
        },
        active: true,
        integration_type: "UTMIFY",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(integration.integration_type).toBe("UTMIFY");
      expect(integration.active).toBe(true);
    });
  });

  describe("UTMifyEventData", () => {
    it("should accept minimal event data", () => {
      const data: UTMifyEventData = {
        event_type: "pageview",
        timestamp: "2025-01-01 00:00:00",
      };

      expect(data.event_type).toBe("pageview");
      expect(data.timestamp).toBe("2025-01-01 00:00:00");
    });

    it("should accept event data with all fields", () => {
      const data: UTMifyEventData = {
        event_type: "conversion",
        timestamp: "2025-01-01 00:00:00",
        value: 99.9,
        currency: "BRL",
        order_id: "order_123",
        customer_email: "test@example.com",
        utm_parameters: {
          src: "fb",
          sck: "123",
          utm_source: "google",
          utm_campaign: "summer",
          utm_medium: "cpc",
          utm_content: "ad1",
          utm_term: "shoes",
        },
      };

      expect(data.value).toBe(99.9);
      expect(data.order_id).toBe("order_123");
      expect(data.utm_parameters?.utm_source).toBe("google");
    });
  });

  describe("UTMifyResponse", () => {
    it("should accept successful response", () => {
      const response: UTMifyResponse = {
        success: true,
        message: "Event sent successfully",
      };

      expect(response.success).toBe(true);
    });

    it("should accept error response", () => {
      const response: UTMifyResponse = {
        success: false,
        message: "Error sending event",
        data: { error: "Network error" },
      };

      expect(response.success).toBe(false);
      expect(response.data).toBeDefined();
    });
  });

  describe("Type Compatibility", () => {
    it("should allow UTMParameters in UTMifyEventData", () => {
      const params: UTMParameters = {
        src: "fb",
        sck: "123",
        utm_source: "google",
        utm_campaign: "summer",
        utm_medium: "cpc",
        utm_content: "ad1",
        utm_term: "shoes",
      };

      const data: UTMifyEventData = {
        event_type: "pageview",
        timestamp: "2025-01-01 00:00:00",
        utm_parameters: params,
      };

      expect(data.utm_parameters?.utm_source).toBe("google");
    });

    it("should allow nested config in UTMifyIntegration", () => {
      const config: UTMifyConfig = {
        api_key: "test_api_key",
        enabled: true,
      };

      const integration: UTMifyIntegration = {
        config,
        active: true,
        integration_type: "UTMIFY",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(integration.config.api_key).toBe("test_api_key");
    });
  });
});
