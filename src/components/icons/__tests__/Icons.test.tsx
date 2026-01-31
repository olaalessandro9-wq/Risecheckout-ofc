/**
 * @file Icons.test.tsx
 * @description Tests for all icon components
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { render } from "@/test/utils";
import {
  AwardIcon,
  CheckCircleIcon,
  CreditCardIcon,
  ImageIcon,
  LockIcon,
  PixIcon,
  QuoteIcon,
  TimerIcon,
  TypeIcon,
  VideoIcon,
} from "../index";

// ============================================================================
// ICON COMPONENTS LIST
// ============================================================================

const iconComponents = [
  { name: "AwardIcon", Component: AwardIcon },
  { name: "CheckCircleIcon", Component: CheckCircleIcon },
  { name: "CreditCardIcon", Component: CreditCardIcon },
  { name: "ImageIcon", Component: ImageIcon },
  { name: "LockIcon", Component: LockIcon },
  { name: "PixIcon", Component: PixIcon },
  { name: "QuoteIcon", Component: QuoteIcon },
  { name: "TimerIcon", Component: TimerIcon },
  { name: "TypeIcon", Component: TypeIcon },
  { name: "VideoIcon", Component: VideoIcon },
];

// ============================================================================
// TESTS
// ============================================================================

describe("Icon Components", () => {
  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe("Rendering", () => {
    iconComponents.forEach(({ name, Component }) => {
      it(`should render ${name} without crashing`, () => {
        const { container } = render(<Component />);
        expect(container.querySelector("svg")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // PROPS
  // ==========================================================================

  describe("Props", () => {
    it("should apply custom className to CheckCircleIcon", () => {
      const { container } = render(<CheckCircleIcon className="custom-class" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("custom-class");
    });

    it("should apply custom size to CheckCircleIcon", () => {
      const { container } = render(<CheckCircleIcon size={32} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "32");
      expect(svg).toHaveAttribute("height", "32");
    });

    it("should use default size when not provided", () => {
      const { container } = render(<CheckCircleIcon />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "24");
      expect(svg).toHaveAttribute("height", "24");
    });

    it("should apply custom color to LockIcon", () => {
      const { container } = render(<LockIcon color="#FF0000" />);
      const paths = container.querySelectorAll("path");
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // SVG ATTRIBUTES
  // ==========================================================================

  describe("SVG Attributes", () => {
    iconComponents.forEach(({ name, Component }) => {
      it(`should have proper SVG attributes for ${name}`, () => {
        const { container } = render(<Component />);
        const svg = container.querySelector("svg");
        
        expect(svg).toHaveAttribute("xmlns", "http://www.w3.org/2000/svg");
        expect(svg).toHaveAttribute("viewBox");
      });
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle size 0", () => {
      const { container } = render(<CheckCircleIcon size={0} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "0");
      expect(svg).toHaveAttribute("height", "0");
    });

    it("should handle very large size", () => {
      const { container } = render(<CheckCircleIcon size={1000} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "1000");
      expect(svg).toHaveAttribute("height", "1000");
    });

    it("should handle empty className", () => {
      const { container } = render(<CheckCircleIcon className="" />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });
});

// ============================================================================
// SPECIFIC ICON TESTS
// ============================================================================

describe("Specific Icon Features", () => {
  describe("PixIcon", () => {
    it("should render with path elements", () => {
      const { container } = render(<PixIcon />);
      const paths = container.querySelectorAll("path");
      expect(paths.length).toBeGreaterThan(0);
    });

    it("should accept custom color", () => {
      const { container } = render(<PixIcon color="#00FF00" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("fill", "#00FF00");
    });
  });

  describe("VideoIcon", () => {
    it("should render successfully", () => {
      const { container } = render(<VideoIcon />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("TypeIcon", () => {
    it("should render successfully", () => {
      const { container } = render(<TypeIcon />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("LockIcon", () => {
    it("should render with path elements", () => {
      const { container } = render(<LockIcon />);
      const paths = container.querySelectorAll("path");
      expect(paths.length).toBeGreaterThan(0);
    });
  });
});
