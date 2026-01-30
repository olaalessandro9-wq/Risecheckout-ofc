/**
 * AspectRatio Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for AspectRatio component covering:
 * - Rendering
 * - Ratio prop
 * - Children rendering
 * - Props forwarding
 *
 * @module components/ui/__tests__/aspect-ratio.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { AspectRatio } from "../aspect-ratio";

describe("AspectRatio", () => {
  describe("Rendering", () => {
    it("renders aspect ratio container", () => {
      render(
        <AspectRatio ratio={16 / 9} data-testid="aspect-ratio">
          <div>Content</div>
        </AspectRatio>
      );
      expect(screen.getByTestId("aspect-ratio")).toBeInTheDocument();
    });

    it("renders children content", () => {
      render(
        <AspectRatio ratio={16 / 9}>
          <div data-testid="content">Child Content</div>
        </AspectRatio>
      );
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByText("Child Content")).toBeInTheDocument();
    });
  });

  describe("Ratio Prop", () => {
    it("accepts 16/9 ratio", () => {
      render(
        <AspectRatio ratio={16 / 9} data-testid="aspect-ratio">
          <div>Content</div>
        </AspectRatio>
      );
      const container = screen.getByTestId("aspect-ratio");
      expect(container).toHaveStyle({ "--radix-aspect-ratio": String(16 / 9) });
    });

    it("accepts 4/3 ratio", () => {
      render(
        <AspectRatio ratio={4 / 3} data-testid="aspect-ratio">
          <div>Content</div>
        </AspectRatio>
      );
      const container = screen.getByTestId("aspect-ratio");
      expect(container).toHaveStyle({ "--radix-aspect-ratio": String(4 / 3) });
    });

    it("accepts 1/1 ratio (square)", () => {
      render(
        <AspectRatio ratio={1} data-testid="aspect-ratio">
          <div>Content</div>
        </AspectRatio>
      );
      const container = screen.getByTestId("aspect-ratio");
      expect(container).toHaveStyle({ "--radix-aspect-ratio": "1" });
    });

    it("accepts custom ratio like 21/9", () => {
      render(
        <AspectRatio ratio={21 / 9} data-testid="aspect-ratio">
          <div>Content</div>
        </AspectRatio>
      );
      const container = screen.getByTestId("aspect-ratio");
      expect(container).toHaveStyle({ "--radix-aspect-ratio": String(21 / 9) });
    });
  });

  describe("Image Container", () => {
    it("renders image inside aspect ratio", () => {
      render(
        <AspectRatio ratio={16 / 9}>
          <img
            src="https://example.com/image.jpg"
            alt="Test image"
            data-testid="image"
            className="object-cover"
          />
        </AspectRatio>
      );
      expect(screen.getByTestId("image")).toBeInTheDocument();
      expect(screen.getByAltText("Test image")).toBeInTheDocument();
    });

    it("renders video inside aspect ratio", () => {
      render(
        <AspectRatio ratio={16 / 9}>
          <video data-testid="video" className="h-full w-full">
            <source src="video.mp4" type="video/mp4" />
          </video>
        </AspectRatio>
      );
      expect(screen.getByTestId("video")).toBeInTheDocument();
    });
  });

  describe("Props Forwarding", () => {
    it("forwards data attributes", () => {
      render(
        <AspectRatio ratio={16 / 9} data-testid="aspect-ratio" data-custom="value">
          <div>Content</div>
        </AspectRatio>
      );
      expect(screen.getByTestId("aspect-ratio")).toHaveAttribute("data-custom", "value");
    });

    it("accepts className", () => {
      render(
        <AspectRatio ratio={16 / 9} className="custom-class" data-testid="aspect-ratio">
          <div>Content</div>
        </AspectRatio>
      );
      expect(screen.getByTestId("aspect-ratio")).toHaveClass("custom-class");
    });

    it("accepts style prop", () => {
      render(
        <AspectRatio ratio={16 / 9} style={{ backgroundColor: "red" }} data-testid="aspect-ratio">
          <div>Content</div>
        </AspectRatio>
      );
      expect(screen.getByTestId("aspect-ratio")).toHaveStyle({ backgroundColor: "red" });
    });
  });

  describe("Complex Content", () => {
    it("renders multiple children", () => {
      render(
        <AspectRatio ratio={16 / 9}>
          <img src="image.jpg" alt="Background" className="object-cover" data-testid="bg-image" />
          <div className="absolute inset-0 flex items-center justify-center" data-testid="overlay">
            <span>Overlay Text</span>
          </div>
        </AspectRatio>
      );
      expect(screen.getByTestId("bg-image")).toBeInTheDocument();
      expect(screen.getByTestId("overlay")).toBeInTheDocument();
      expect(screen.getByText("Overlay Text")).toBeInTheDocument();
    });
  });
});
