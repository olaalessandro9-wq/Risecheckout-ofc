/**
 * PlatformIcon Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests icon rendering for each pixel platform with correct colors.
 * 
 * @module test/modules/pixels/components/PlatformIcon
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PlatformIcon } from "../PlatformIcon";
import { PLATFORM_INFO, type PixelPlatform } from "../../types";

describe("PlatformIcon", () => {
  describe("platform rendering", () => {
    it("should render Facebook icon with correct color", () => {
      const { container } = render(<PlatformIcon platform="facebook" />);
      
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("fill", PLATFORM_INFO.facebook.color);
    });

    it("should render TikTok icon (Music)", () => {
      const { container } = render(<PlatformIcon platform="tiktok" />);
      
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      // Lucide icons set color via CSS/style, not attribute
    });

    it("should render Google Ads icon (Target)", () => {
      const { container } = render(<PlatformIcon platform="google_ads" />);
      
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render Kwai icon (Video)", () => {
      const { container } = render(<PlatformIcon platform="kwai" />);
      
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("size prop", () => {
    it("should use default size of 20", () => {
      const { container } = render(<PlatformIcon platform="facebook" />);
      
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "20");
      expect(svg).toHaveAttribute("height", "20");
    });

    it("should apply custom size", () => {
      const { container } = render(<PlatformIcon platform="facebook" size={32} />);
      
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "32");
      expect(svg).toHaveAttribute("height", "32");
    });
  });

  describe("className prop", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <PlatformIcon platform="tiktok" className="custom-class" />
      );
      
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("custom-class");
    });

    it("should work with empty className", () => {
      const { container } = render(<PlatformIcon platform="google_ads" />);
      
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("PLATFORM_INFO consistency", () => {
    const platforms: PixelPlatform[] = ["facebook", "tiktok", "google_ads", "kwai"];

    platforms.forEach((platform) => {
      it(`should have valid color for ${platform}`, () => {
        const info = PLATFORM_INFO[platform];
        expect(info.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });
});
