/**
 * @file BadgeBlock.test.tsx
 * @description Tests for BadgeBlock Component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { BadgeBlock, type BadgeBlockProps } from "../BadgeBlock";

describe("BadgeBlock", () => {
  const defaultProps: BadgeBlockProps = {
    topText: "100%",
    title: "GARANTIA",
    subtitle: "7 DIAS",
    primaryColor: "#10B981",
    titleColor: "#FFFFFF",
    alignment: "center",
    darkMode: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== Rendering ==========

  describe("Rendering", () => {
    it("should render correctly with default props", () => {
      render(<BadgeBlock {...defaultProps} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("GARANTIA")).toBeInTheDocument();
      expect(screen.getByText("7 DIAS")).toBeInTheDocument();
    });

    it("should render with custom content", () => {
      render(
        <BadgeBlock
          {...defaultProps}
          topText="TOP"
          title="CUSTOM"
          subtitle="BOTTOM"
        />
      );

      expect(screen.getByText("TOP")).toBeInTheDocument();
      expect(screen.getByText("CUSTOM")).toBeInTheDocument();
      expect(screen.getByText("BOTTOM")).toBeInTheDocument();
    });

    it("should render with empty strings", () => {
      const { container } = render(
        <BadgeBlock
          {...defaultProps}
          topText=""
          title=""
          subtitle=""
        />
      );

      // Component should render without crashing
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  // ========== Styling ==========

  describe("Styling", () => {
    it("should apply primary color to borders and text", () => {
      const { container } = render(
        <BadgeBlock {...defaultProps} primaryColor="#FF0000" />
      );

      const topText = screen.getByText("100%");
      expect(topText).toHaveStyle({ color: "#FF0000" });
    });

    it("should apply title color to ribbon text", () => {
      render(<BadgeBlock {...defaultProps} titleColor="#000000" />);

      const title = screen.getByText("GARANTIA");
      expect(title).toHaveStyle({ color: "#000000" });
    });

    it("should render with dark mode", () => {
      const { container } = render(
        <BadgeBlock {...defaultProps} darkMode={true} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });

    it("should render with light mode", () => {
      const { container } = render(
        <BadgeBlock {...defaultProps} darkMode={false} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <BadgeBlock {...defaultProps} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });
  });

  // ========== Alignment ==========

  describe("Alignment", () => {
    it("should apply center alignment", () => {
      const { container } = render(
        <BadgeBlock {...defaultProps} alignment="center" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("justify-center");
    });

    it("should apply left alignment", () => {
      const { container } = render(
        <BadgeBlock {...defaultProps} alignment="left" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("justify-start");
    });

    it("should apply right alignment", () => {
      const { container } = render(
        <BadgeBlock {...defaultProps} alignment="right" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("justify-end");
    });
  });

  // ========== Interactions ==========

  describe("Interactions", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      render(<BadgeBlock {...defaultProps} onClick={handleClick} />);

      const wrapper = screen.getByText("GARANTIA").closest("div")?.parentElement;
      wrapper?.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not crash when onClick is undefined", () => {
      render(<BadgeBlock {...defaultProps} onClick={undefined} />);

      const wrapper = screen.getByText("GARANTIA").closest("div")?.parentElement;
      
      expect(() => wrapper?.click()).not.toThrow();
    });
  });

  // ========== Edge Cases ==========

  describe("Edge Cases", () => {
    it("should handle very long text", () => {
      const longTextA = "A".repeat(100);
      const longTextB = "B".repeat(100);
      const longTextC = "C".repeat(100);

      render(
        <BadgeBlock
          {...defaultProps}
          topText={longTextA}
          title={longTextB}
          subtitle={longTextC}
        />
      );

      expect(screen.getByText(longTextA)).toBeInTheDocument();
      expect(screen.getByText(longTextB)).toBeInTheDocument();
      expect(screen.getByText(longTextC)).toBeInTheDocument();
    });

    it("should handle special characters", () => {
      const specialTop = "<>&";
      const specialTitle = "'\"@";
      const specialSubtitle = "!#$%";

      render(
        <BadgeBlock
          {...defaultProps}
          topText={specialTop}
          title={specialTitle}
          subtitle={specialSubtitle}
        />
      );

      expect(screen.getByText(specialTop)).toBeInTheDocument();
      expect(screen.getByText(specialTitle)).toBeInTheDocument();
      expect(screen.getByText(specialSubtitle)).toBeInTheDocument();
    });

    it("should handle invalid color values gracefully", () => {
      const { container } = render(
        <BadgeBlock
          {...defaultProps}
          primaryColor="invalid-color"
          titleColor="invalid-color"
        />
      );

      // Component should render without crashing
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
