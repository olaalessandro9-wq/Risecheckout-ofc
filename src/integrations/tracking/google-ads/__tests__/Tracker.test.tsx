/**
 * @file Tracker.test.tsx
 * @description Tests for Google Ads Tracker component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Tracker } from "../Tracker";
import type { GoogleAdsIntegration } from "../types";

describe("Google Ads Tracker Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.querySelectorAll('script[src*="googletagmanager"]').forEach((s) => s.remove());
    delete (window as Record<string, unknown>).gtag;
    delete (window as Record<string, unknown>).dataLayer;
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render nothing visible", () => {
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

      const { container } = render(<Tracker integration={integration} />);

      expect(container.firstChild).toBeNull();
    });

    it("should have correct display name", () => {
      expect(Tracker.displayName).toBe("GoogleAdsTracker");
    });
  });

  describe("Initialization", () => {
    it("should not inject script if integration is null", () => {
      render(<Tracker integration={null} />);

      const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
      expect(scripts.length).toBe(0);
    });

    it("should not inject script if inactive", () => {
      const integration: GoogleAdsIntegration = {
        config: {
          conversion_id: "AW-123456789",
          conversion_label: "test_label",
        },
        active: false,
        integration_type: "GOOGLE_ADS",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Tracker integration={integration} />);

      const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
      expect(scripts.length).toBe(0);
    });

    it("should not inject script if conversion_id is empty", () => {
      const integration: GoogleAdsIntegration = {
        config: {
          conversion_id: "",
          conversion_label: "test_label",
        },
        active: true,
        integration_type: "GOOGLE_ADS",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Tracker integration={integration} />);

      const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
      expect(scripts.length).toBe(0);
    });

    it("should inject script with valid integration", () => {
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

      render(<Tracker integration={integration} />);

      const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
      expect(scripts.length).toBeGreaterThan(0);
    });

    it("should initialize gtag and dataLayer", () => {
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

      render(<Tracker integration={integration} />);

      expect(window.gtag).toBeDefined();
      expect(typeof window.gtag).toBe("function");
      expect(window.dataLayer).toBeDefined();
      expect(Array.isArray(window.dataLayer)).toBe(true);
    });
  });

  describe("Script Injection", () => {
    it("should not duplicate scripts on re-render", () => {
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

      const { rerender } = render(<Tracker integration={integration} />);

      const scriptsBefore = document.querySelectorAll('script[src*="googletagmanager"]').length;

      rerender(<Tracker integration={integration} />);

      const scriptsAfter = document.querySelectorAll('script[src*="googletagmanager"]').length;

      expect(scriptsAfter).toBe(scriptsBefore);
    });

    it("should set correct script src with conversion_id", () => {
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

      render(<Tracker integration={integration} />);

      const script = document.querySelector('script[src*="googletagmanager"]');

      expect(script).not.toBeNull();
      expect(script?.getAttribute("src")).toContain("AW-123456789");
    });
  });

  describe("Configuration Handling", () => {
    it("should handle selected_products option", () => {
      const integration: GoogleAdsIntegration = {
        config: {
          conversion_id: "AW-123456789",
          conversion_label: "test_label",
          selected_products: ["prod_1", "prod_2"],
        },
        active: true,
        integration_type: "GOOGLE_ADS",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Tracker integration={integration} />);

      expect(window.gtag).toBeDefined();
    });

    it("should handle event_labels option", () => {
      const integration: GoogleAdsIntegration = {
        config: {
          conversion_id: "AW-123456789",
          conversion_label: "test_label",
          event_labels: [
            { eventType: "purchase", label: "purchase_label", enabled: true },
          ],
        },
        active: true,
        integration_type: "GOOGLE_ADS",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Tracker integration={integration} />);

      expect(window.gtag).toBeDefined();
    });
  });

  describe("Cleanup", () => {
    it("should maintain gtag after unmount", () => {
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

      const { unmount } = render(<Tracker integration={integration} />);

      expect(window.gtag).toBeDefined();

      unmount();

      expect(window.gtag).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle integration changes", () => {
      const integration1: GoogleAdsIntegration = {
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

      const { rerender } = render(<Tracker integration={integration1} />);

      const integration2: GoogleAdsIntegration = {
        config: {
          conversion_id: "AW-987654321",
          conversion_label: "test_label_2",
        },
        active: true,
        integration_type: "GOOGLE_ADS",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      rerender(<Tracker integration={integration2} />);

      expect(window.gtag).toBeDefined();
    });

    it("should handle inactive to active transition", () => {
      const integration1: GoogleAdsIntegration = {
        config: {
          conversion_id: "AW-123456789",
          conversion_label: "test_label",
        },
        active: false,
        integration_type: "GOOGLE_ADS",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const { rerender } = render(<Tracker integration={integration1} />);

      expect(window.gtag).toBeUndefined();

      const integration2: GoogleAdsIntegration = {
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

      rerender(<Tracker integration={integration2} />);

      expect(window.gtag).toBeDefined();
    });
  });
});
