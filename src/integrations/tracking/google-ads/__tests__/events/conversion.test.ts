/**
 * @file conversion.test.ts
 * @description Tests for Google Ads conversion events
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getConversionLabel,
  isValidGoogleAdsConfig,
  sendGoogleAdsConversion,
  trackPurchase,
  trackLead,
} from "../../events/conversion";
import type {
  GoogleAdsConfig,
  GoogleAdsConversionData,
  GoogleAdsItem,
  GoogleAdsCustomer,
} from "../../types";

const mockGtag = vi.fn();

// ============================================================================
// FACTORY
// ============================================================================

function createMockConfig(overrides?: Partial<GoogleAdsConfig>): GoogleAdsConfig {
  return {
    conversion_id: "AW-123456789",
    conversion_label: "global_label",
    enabled: true,
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe("Google Ads Conversion Events", () => {
  beforeEach(() => {
    (window as unknown as Record<string, unknown>).gtag = mockGtag;
    (window as unknown as Record<string, unknown>).dataLayer = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).gtag;
    delete (window as unknown as Record<string, unknown>).dataLayer;
  });

  describe("getConversionLabel", () => {
    it("should return event-specific label when available", () => {
      const config = createMockConfig({
        event_labels: [
          { eventType: "purchase", label: "purchase_label", enabled: true },
        ],
      });

      const label = getConversionLabel(config, "purchase");
      expect(label).toBe("purchase_label");
    });

    it("should return global label when event label not found", () => {
      const config = createMockConfig({ event_labels: [] });
      const label = getConversionLabel(config, "purchase");
      expect(label).toBe("global_label");
    });

    it("should skip disabled event labels", () => {
      const config = createMockConfig({
        event_labels: [
          { eventType: "purchase", label: "disabled_label", enabled: false },
        ],
      });

      const label = getConversionLabel(config, "purchase");
      expect(label).toBe("global_label");
    });

    it("should return global label when eventType is undefined", () => {
      const config = createMockConfig();
      const label = getConversionLabel(config);
      expect(label).toBe("global_label");
    });
  });

  describe("isValidGoogleAdsConfig", () => {
    it("should return true for valid config with global label", () => {
      const config = createMockConfig();
      expect(isValidGoogleAdsConfig(config)).toBe(true);
    });

    it("should return true for valid config with event labels", () => {
      const config = createMockConfig({
        conversion_label: undefined,
        event_labels: [
          { eventType: "purchase", label: "purchase_label", enabled: true },
        ],
      });

      expect(isValidGoogleAdsConfig(config)).toBe(true);
    });

    it("should return false if conversion_id is missing", () => {
      const config = createMockConfig({ conversion_id: "" });
      expect(isValidGoogleAdsConfig(config)).toBe(false);
    });

    it("should return false if no labels are configured", () => {
      const config = createMockConfig({
        conversion_label: undefined,
        event_labels: undefined,
      });

      expect(isValidGoogleAdsConfig(config)).toBe(false);
    });
  });

  describe("sendGoogleAdsConversion", () => {
    it("should send conversion with gtag", async () => {
      const config = createMockConfig();

      const conversionData: GoogleAdsConversionData = {
        conversionId: "AW-123456789",
        conversionTimestamp: Math.floor(Date.now() / 1000),
        conversionValue: 99.9,
        currencyCode: "BRL",
        conversionLabel: "test_label",
        eventType: "purchase",
      };

      const result = await sendGoogleAdsConversion(config, conversionData);

      expect(mockGtag).toHaveBeenCalledWith("event", "conversion", expect.any(Object));
      expect(result.success).toBe(true);
    });

    it("should return error if config is invalid", async () => {
      const config = createMockConfig({
        conversion_id: "",
        conversion_label: "",
      });

      const conversionData: GoogleAdsConversionData = {
        conversionId: "",
        conversionTimestamp: Math.floor(Date.now() / 1000),
        conversionValue: 99.9,
        currencyCode: "BRL",
        conversionLabel: "test_label",
        eventType: "purchase",
      };

      const result = await sendGoogleAdsConversion(config, conversionData);

      expect(result.success).toBe(false);
      expect(result.message).toContain("inválida");
    });

    it("should return error if gtag is not available", async () => {
      delete (window as unknown as Record<string, unknown>).gtag;

      const config = createMockConfig();

      const conversionData: GoogleAdsConversionData = {
        conversionId: "AW-123456789",
        conversionTimestamp: Math.floor(Date.now() / 1000),
        conversionValue: 99.9,
        currencyCode: "BRL",
        conversionLabel: "test_label",
        eventType: "purchase",
      };

      const result = await sendGoogleAdsConversion(config, conversionData);

      expect(result.success).toBe(false);
      expect(result.message).toContain("gtag");
    });

    it("should include items in conversion", async () => {
      const config = createMockConfig();

      const items: GoogleAdsItem[] = [
        { id: "prod_1", name: "Product 1", price: 99.9, quantity: 1 },
      ];

      const conversionData: GoogleAdsConversionData = {
        conversionId: "AW-123456789",
        conversionTimestamp: Math.floor(Date.now() / 1000),
        conversionValue: 99.9,
        currencyCode: "BRL",
        conversionLabel: "test_label",
        items,
        eventType: "purchase",
      };

      await sendGoogleAdsConversion(config, conversionData);

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "conversion",
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ id: "prod_1", name: "Product 1" }),
          ]),
        })
      );
    });

    it("should include customer data in conversion", async () => {
      const config = createMockConfig();

      const customer: GoogleAdsCustomer = {
        email_hash: "hashed_email",
        phone_hash: "hashed_phone",
        address: "123 Main St",
        city: "São Paulo",
        state: "SP",
        zip_code: "01234-567",
        country: "BR",
      };

      const conversionData: GoogleAdsConversionData = {
        conversionId: "AW-123456789",
        conversionTimestamp: Math.floor(Date.now() / 1000),
        conversionValue: 99.9,
        currencyCode: "BRL",
        conversionLabel: "test_label",
        customer,
        eventType: "purchase",
      };

      await sendGoogleAdsConversion(config, conversionData);

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "conversion",
        expect.objectContaining({
          email: "hashed_email",
          phone_number: "hashed_phone",
          address: "123 Main St",
          city: "São Paulo",
          state: "SP",
          postal_code: "01234-567",
          country: "BR",
        })
      );
    });
  });

  describe("trackPurchase", () => {
    it("should track purchase conversion", async () => {
      const config = createMockConfig({ conversion_label: "purchase_label" });
      const result = await trackPurchase(config, "order_123", 99.9);

      expect(mockGtag).toHaveBeenCalledWith("event", "conversion", expect.any(Object));
      expect(result.success).toBe(true);
    });

    it("should return error if purchase label not configured", async () => {
      const config = createMockConfig({ conversion_label: undefined });
      const result = await trackPurchase(config, "order_123", 99.9);

      expect(result.success).toBe(false);
      expect(result.message).toContain("purchase");
    });

    it("should include items and customer in purchase", async () => {
      const config = createMockConfig({ conversion_label: "purchase_label" });

      const items: GoogleAdsItem[] = [
        { id: "prod_1", name: "Product 1", price: 99.9, quantity: 1 },
      ];

      const customer: GoogleAdsCustomer = { email_hash: "hashed_email" };

      await trackPurchase(config, "order_123", 99.9, items, customer);

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "conversion",
        expect.objectContaining({
          transaction_id: "order_123",
          value: 99.9,
          items: expect.any(Array),
          email: "hashed_email",
        })
      );
    });
  });

  describe("trackLead", () => {
    it("should track lead conversion", async () => {
      const config = createMockConfig({ conversion_label: "lead_label" });
      const result = await trackLead(config);

      expect(mockGtag).toHaveBeenCalledWith("event", "conversion", expect.any(Object));
      expect(result.success).toBe(true);
    });

    it("should return error if lead label not configured", async () => {
      const config = createMockConfig({ conversion_label: undefined });
      const result = await trackLead(config);

      expect(result.success).toBe(false);
      expect(result.message).toContain("lead");
    });

    it("should include customer in lead", async () => {
      const config = createMockConfig({ conversion_label: "lead_label" });

      const customer: GoogleAdsCustomer = {
        email_hash: "hashed_email",
        phone_hash: "hashed_phone",
      };

      await trackLead(config, 0, customer);

      expect(mockGtag).toHaveBeenCalledWith(
        "event",
        "conversion",
        expect.objectContaining({
          email: "hashed_email",
          phone_number: "hashed_phone",
        })
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle SSR environment", async () => {
      const originalWindow = global.window;
      delete (global as { window?: Window }).window;

      const config = createMockConfig();

      const conversionData: GoogleAdsConversionData = {
        conversionId: "AW-123456789",
        conversionTimestamp: Math.floor(Date.now() / 1000),
        conversionValue: 99.9,
        currencyCode: "BRL",
        conversionLabel: "test_label",
        eventType: "purchase",
      };

      const result = await sendGoogleAdsConversion(config, conversionData);

      expect(result.success).toBe(false);

      (global as { window?: Window }).window = originalWindow;
    });

    it("should handle errors during tracking", async () => {
      mockGtag.mockImplementationOnce(() => {
        throw new Error("Tracking error");
      });

      const config = createMockConfig();

      const conversionData: GoogleAdsConversionData = {
        conversionId: "AW-123456789",
        conversionTimestamp: Math.floor(Date.now() / 1000),
        conversionValue: 99.9,
        currencyCode: "BRL",
        conversionLabel: "test_label",
        eventType: "purchase",
      };

      const result = await sendGoogleAdsConversion(config, conversionData);

      expect(result.success).toBe(false);
    });
  });
});
