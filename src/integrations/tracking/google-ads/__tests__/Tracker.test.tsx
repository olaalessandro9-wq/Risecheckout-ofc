/**
 * @file Tracker.test.tsx
 * @description Tests for Google Ads Tracker component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Tracker } from "../Tracker";
import { createMockIntegration, cleanupGoogleAdsGlobals } from "./_test-helpers";

describe("Google Ads Tracker Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupGoogleAdsGlobals();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render nothing visible", () => {
      const integration = createMockIntegration();
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
      const integration = createMockIntegration({ active: false });
      render(<Tracker integration={integration} />);
      const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
      expect(scripts.length).toBe(0);
    });

    it("should not inject script if conversion_id is empty", () => {
      const integration = createMockIntegration({
        config: { conversion_id: "", conversion_label: "test_label", enabled: true },
      });
      render(<Tracker integration={integration} />);
      const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
      expect(scripts.length).toBe(0);
    });

    it("should inject script with valid integration", () => {
      const integration = createMockIntegration();
      render(<Tracker integration={integration} />);
      const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
      expect(scripts.length).toBeGreaterThan(0);
    });

    it("should initialize gtag and dataLayer", () => {
      const integration = createMockIntegration();
      render(<Tracker integration={integration} />);
      expect(window.gtag).toBeDefined();
      expect(typeof window.gtag).toBe("function");
      expect(window.dataLayer).toBeDefined();
      expect(Array.isArray(window.dataLayer)).toBe(true);
    });
  });

  describe("Script Injection", () => {
    it("should not duplicate scripts on re-render", () => {
      const integration = createMockIntegration();
      const { rerender } = render(<Tracker integration={integration} />);
      const scriptsBefore = document.querySelectorAll('script[src*="googletagmanager"]').length;
      rerender(<Tracker integration={integration} />);
      const scriptsAfter = document.querySelectorAll('script[src*="googletagmanager"]').length;
      expect(scriptsAfter).toBe(scriptsBefore);
    });

    it("should set correct script src with conversion_id", () => {
      const integration = createMockIntegration();
      render(<Tracker integration={integration} />);
      const script = document.querySelector('script[src*="googletagmanager"]');
      expect(script).not.toBeNull();
      expect(script?.getAttribute("src")).toContain("AW-123456789");
    });
  });

  describe("Configuration Handling", () => {
    it("should handle selected_products option", () => {
      const integration = createMockIntegration({
        config: {
          conversion_id: "AW-123456789",
          conversion_label: "test_label",
          enabled: true,
          selected_products: ["prod_1", "prod_2"],
        },
      });
      render(<Tracker integration={integration} />);
      expect(window.gtag).toBeDefined();
    });

    it("should handle event_labels option", () => {
      const integration = createMockIntegration({
        config: {
          conversion_id: "AW-123456789",
          conversion_label: "test_label",
          enabled: true,
          event_labels: [
            { eventType: "purchase", label: "purchase_label", enabled: true },
          ],
        },
      });
      render(<Tracker integration={integration} />);
      expect(window.gtag).toBeDefined();
    });
  });

  describe("Cleanup", () => {
    it("should maintain gtag after unmount", () => {
      const integration = createMockIntegration();
      const { unmount } = render(<Tracker integration={integration} />);
      expect(window.gtag).toBeDefined();
      unmount();
      expect(window.gtag).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle integration changes", () => {
      const integration1 = createMockIntegration();
      const { rerender } = render(<Tracker integration={integration1} />);
      const integration2 = createMockIntegration({
        config: {
          conversion_id: "AW-987654321",
          conversion_label: "test_label_2",
          enabled: true,
        },
      });
      rerender(<Tracker integration={integration2} />);
      expect(window.gtag).toBeDefined();
    });

    it("should handle inactive to active transition", () => {
      const integration1 = createMockIntegration({ active: false });
      const { rerender } = render(<Tracker integration={integration1} />);
      expect(window.gtag).toBeUndefined();
      const integration2 = createMockIntegration({ active: true });
      rerender(<Tracker integration={integration2} />);
      expect(window.gtag).toBeDefined();
    });
  });
});
