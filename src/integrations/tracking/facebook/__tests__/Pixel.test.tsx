/**
 * @file Pixel.test.tsx
 * @description Tests for Facebook Pixel component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Pixel } from "../Pixel";
import type { FacebookPixelConfig } from "../types";

describe("Facebook Pixel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.querySelectorAll('script[src*="facebook"]').forEach((s) => s.remove());
    delete (window as unknown as Record<string, unknown>).fbq;
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render nothing visible", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const { container } = render(<Pixel config={config} />);

      expect(container.firstChild).toBeNull();
    });

    it("should have correct display name", () => {
      expect(Pixel.displayName).toBe("FacebookPixel");
    });
  });

  describe("Initialization", () => {
    it("should not inject script if config is null", () => {
      render(<Pixel config={null} />);

      const scripts = document.querySelectorAll('script[src*="facebook"]');
      expect(scripts.length).toBe(0);
    });

    it("should not inject script if disabled", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: false,
      };

      render(<Pixel config={config} />);

      const scripts = document.querySelectorAll('script[src*="facebook"]');
      expect(scripts.length).toBe(0);
    });

    it("should not inject script if pixel_id is empty", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "",
        enabled: true,
      };

      render(<Pixel config={config} />);

      const scripts = document.querySelectorAll('script[src*="facebook"]');
      expect(scripts.length).toBe(0);
    });

    it("should inject script with valid config", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      render(<Pixel config={config} />);

      const scripts = document.querySelectorAll('script[src*="facebook"]');
      expect(scripts.length).toBeGreaterThan(0);
    });

    it("should initialize fbq function", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      render(<Pixel config={config} />);

      expect(window.fbq).toBeDefined();
      expect(typeof window.fbq).toBe("function");
    });
  });

  describe("Script Injection", () => {
    it("should not duplicate scripts on re-render", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const { rerender } = render(<Pixel config={config} />);

      const scriptsBefore = document.querySelectorAll('script[src*="facebook"]').length;

      rerender(<Pixel config={config} />);

      const scriptsAfter = document.querySelectorAll('script[src*="facebook"]').length;

      expect(scriptsAfter).toBe(scriptsBefore);
    });

    it("should set correct script src", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      render(<Pixel config={config} />);

      const script = document.querySelector('script[src*="facebook"]');

      expect(script).not.toBeNull();
      expect(script?.getAttribute("src")).toBe("https://connect.facebook.net/en_US/fbevents.js");
    });
  });

  describe("Configuration Handling", () => {
    it("should handle fire_purchase_on_pix option", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
        fire_purchase_on_pix: true,
      };

      render(<Pixel config={config} />);

      expect(window.fbq).toBeDefined();
    });

    it("should handle selected_products option", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
        selected_products: ["prod_1", "prod_2"],
      };

      render(<Pixel config={config} />);

      expect(window.fbq).toBeDefined();
    });

    it("should handle access_token option", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
        access_token: "test_token_123",
      };

      render(<Pixel config={config} />);

      expect(window.fbq).toBeDefined();
    });
  });

  describe("Cleanup", () => {
    it("should maintain fbq after unmount", () => {
      const config: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const { unmount } = render(<Pixel config={config} />);

      expect(window.fbq).toBeDefined();

      unmount();

      expect(window.fbq).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle config changes", () => {
      const config1: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      const { rerender } = render(<Pixel config={config1} />);

      const config2: FacebookPixelConfig = {
        pixel_id: "987654321",
        enabled: true,
      };

      rerender(<Pixel config={config2} />);

      expect(window.fbq).toBeDefined();
    });

    it("should handle disabled to enabled transition", () => {
      const config1: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: false,
      };

      const { rerender } = render(<Pixel config={config1} />);

      expect(window.fbq).toBeUndefined();

      const config2: FacebookPixelConfig = {
        pixel_id: "123456789",
        enabled: true,
      };

      rerender(<Pixel config={config2} />);

      expect(window.fbq).toBeDefined();
    });
  });
});
