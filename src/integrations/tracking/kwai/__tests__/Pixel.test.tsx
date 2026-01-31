/**
 * @file Pixel.test.tsx
 * @description Tests for Kwai Pixel component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Pixel } from "../Pixel";
import type { KwaiIntegration } from "../types";

describe("Kwai Pixel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.querySelectorAll('script[src*="kwai"]').forEach((s) => s.remove());
    delete (window as Record<string, unknown>).kwaiq;
    delete (window as Record<string, unknown>)._kwai_pixel;
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render nothing visible", () => {
      const config: KwaiIntegration = {
        config: { pixel_id: "123456789", enabled: true },
        active: true,
        integration_type: "KWAI_PIXEL",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const { container } = render(<Pixel config={config} />);
      expect(container.firstChild).toBeNull();
    });

    it("should have correct display name", () => {
      expect(Pixel.displayName).toBe("KwaiPixel");
    });
  });

  describe("Initialization", () => {
    it("should not inject script if config is null", () => {
      render(<Pixel config={null} />);
      expect(document.querySelectorAll('script[src*="kwai"]').length).toBe(0);
    });

    it("should not inject script if inactive", () => {
      const config: KwaiIntegration = {
        config: { pixel_id: "123456789", enabled: true },
        active: false,
        integration_type: "KWAI_PIXEL",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Pixel config={config} />);
      expect(document.querySelectorAll('script[src*="kwai"]').length).toBe(0);
    });

    it("should inject script with valid config", () => {
      const config: KwaiIntegration = {
        config: { pixel_id: "123456789", enabled: true },
        active: true,
        integration_type: "KWAI_PIXEL",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Pixel config={config} />);
      expect(document.querySelectorAll('script[src*="kwai"]').length).toBeGreaterThan(0);
    });

    it("should initialize kwaiq function", () => {
      const config: KwaiIntegration = {
        config: { pixel_id: "123456789", enabled: true },
        active: true,
        integration_type: "KWAI_PIXEL",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      render(<Pixel config={config} />);
      expect(window.kwaiq).toBeDefined();
      expect(typeof window.kwaiq).toBe("function");
    });
  });

  describe("Edge Cases", () => {
    it("should not duplicate scripts on re-render", () => {
      const config: KwaiIntegration = {
        config: { pixel_id: "123456789", enabled: true },
        active: true,
        integration_type: "KWAI_PIXEL",
        vendor_id: "vendor_123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const { rerender } = render(<Pixel config={config} />);
      const scriptsBefore = document.querySelectorAll('script[src*="kwai"]').length;
      rerender(<Pixel config={config} />);
      const scriptsAfter = document.querySelectorAll('script[src*="kwai"]').length;
      expect(scriptsAfter).toBe(scriptsBefore);
    });
  });
});
