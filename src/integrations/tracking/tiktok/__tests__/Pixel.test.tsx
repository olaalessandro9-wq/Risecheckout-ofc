/**
 * @file Pixel.test.tsx
 * @description Tests for TikTok Pixel component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Pixel } from "../Pixel";
import type { TikTokIntegration } from "../types";

describe("TikTok Pixel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document
      .querySelectorAll('script[src*="tiktok"]')
      .forEach((s) => s.remove());
    delete (window as unknown as Record<string, unknown>).ttq;
    delete (window as unknown as Record<string, unknown>)._tiktok_pixel;
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render nothing visible", () => {
      const config: TikTokIntegration = {
        id: "integration_123",
        config: {
          pixel_id: "123456789",
          enabled: true,
        },
        active: true,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const { container } = render(<Pixel config={config} />);

      expect(container.firstChild).toBeNull();
    });

    it("should have correct display name", () => {
      expect(Pixel.displayName).toBe("TikTokPixel");
    });
  });

  describe("Initialization", () => {
    it("should not inject script if config is null", () => {
      render(<Pixel config={null} />);

      const scripts = document.querySelectorAll('script[src*="tiktok"]');
      expect(scripts.length).toBe(0);
    });

    it("should not inject script if inactive", () => {
      const config: TikTokIntegration = {
        id: "integration_123",
        config: {
          pixel_id: "123456789",
          enabled: true,
        },
        active: false,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Pixel config={config} />);

      const scripts = document.querySelectorAll('script[src*="tiktok"]');
      expect(scripts.length).toBe(0);
    });

    it("should not inject script if pixel_id is empty", () => {
      const config: TikTokIntegration = {
        id: "integration_123",
        config: {
          pixel_id: "",
          enabled: true,
        },
        active: true,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Pixel config={config} />);

      const scripts = document.querySelectorAll('script[src*="tiktok"]');
      expect(scripts.length).toBe(0);
    });

    it("should inject script with valid config", () => {
      const config: TikTokIntegration = {
        id: "integration_123",
        config: {
          pixel_id: "123456789",
          enabled: true,
        },
        active: true,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Pixel config={config} />);

      const scripts = document.querySelectorAll('script[src*="tiktok"]');
      expect(scripts.length).toBeGreaterThan(0);
    });

    it("should initialize ttq object", () => {
      const config: TikTokIntegration = {
        id: "integration_123",
        config: {
          pixel_id: "123456789",
          enabled: true,
        },
        active: true,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Pixel config={config} />);

      expect(window.ttq).toBeDefined();
      expect(typeof window.ttq?.track).toBe("function");
      expect(typeof window.ttq?.page).toBe("function");
      expect(typeof window.ttq?.load).toBe("function");
      expect(typeof window.ttq?.identify).toBe("function");
    });
  });

  describe("Script Injection", () => {
    it("should not duplicate scripts on re-render", () => {
      const config: TikTokIntegration = {
        id: "integration_123",
        config: {
          pixel_id: "123456789",
          enabled: true,
        },
        active: true,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const { rerender } = render(<Pixel config={config} />);

      const scriptsBefore = document.querySelectorAll(
        'script[src*="tiktok"]'
      ).length;

      rerender(<Pixel config={config} />);

      const scriptsAfter = document.querySelectorAll(
        'script[src*="tiktok"]'
      ).length;

      expect(scriptsAfter).toBe(scriptsBefore);
    });

    it("should set correct script src", () => {
      const config: TikTokIntegration = {
        id: "integration_123",
        config: {
          pixel_id: "123456789",
          enabled: true,
        },
        active: true,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Pixel config={config} />);

      const script = document.querySelector('script[src*="tiktok"]');

      expect(script).not.toBeNull();
      expect(script?.getAttribute("src")).toBe(
        "https://analytics.tiktok.com/i18n/pixel/events.js?v=1"
      );
    });
  });

  describe("Configuration Handling", () => {
    it("should handle selected_products option", () => {
      const config: TikTokIntegration = {
        id: "integration_123",
        config: {
          pixel_id: "123456789",
          enabled: true,
          selected_products: ["prod_1", "prod_2"],
        },
        active: true,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Pixel config={config} />);

      expect(window.ttq).toBeDefined();
    });
  });

  describe("Cleanup", () => {
    it("should maintain ttq after unmount", () => {
      const config: TikTokIntegration = {
        id: "integration_123",
        config: {
          pixel_id: "123456789",
          enabled: true,
        },
        active: true,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const { unmount } = render(<Pixel config={config} />);

      expect(window.ttq).toBeDefined();

      unmount();

      expect(window.ttq).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle config changes", () => {
      const config1: TikTokIntegration = {
        id: "integration_123",
        config: {
          pixel_id: "123456789",
          enabled: true,
        },
        active: true,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const { rerender } = render(<Pixel config={config1} />);

      const config2: TikTokIntegration = {
        id: "integration_456",
        config: {
          pixel_id: "987654321",
          enabled: true,
        },
        active: true,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      rerender(<Pixel config={config2} />);

      expect(window.ttq).toBeDefined();
    });

    it("should handle inactive to active transition", () => {
      const config1: TikTokIntegration = {
        id: "integration_123",
        config: {
          pixel_id: "123456789",
          enabled: true,
        },
        active: false,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const { rerender } = render(<Pixel config={config1} />);

      expect(window.ttq).toBeUndefined();

      const config2: TikTokIntegration = {
        id: "integration_123",
        config: {
          pixel_id: "123456789",
          enabled: true,
        },
        active: true,
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      rerender(<Pixel config={config2} />);

      expect(window.ttq).toBeDefined();
    });
  });
});
