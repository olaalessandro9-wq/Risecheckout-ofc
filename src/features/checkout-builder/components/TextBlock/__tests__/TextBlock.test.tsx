/**
 * @file TextBlock.test.tsx
 * @description Tests for TextBlock Component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { TextBlock, type TextBlockProps } from "../TextBlock";

describe("TextBlock", () => {
  const defaultProps: TextBlockProps = {
    text: "Sample text content",
    textColor: "#000000",
    fontSize: 16,
    textAlign: "left",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 8,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== Rendering ==========

  describe("Rendering", () => {
    it("should render correctly with default props", () => {
      render(<TextBlock {...defaultProps} />);

      expect(screen.getByText("Sample text content")).toBeInTheDocument();
    });

    it("should render with custom text", () => {
      render(<TextBlock {...defaultProps} text="Custom text" />);

      expect(screen.getByText("Custom text")).toBeInTheDocument();
    });

    it("should render with empty text", () => {
      const { container } = render(<TextBlock {...defaultProps} text="" />);

      const paragraph = container.querySelector("p");
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe("");
    });

    it("should render with multiline text", () => {
      const multilineText = "Line 1\nLine 2\nLine 3";
      const { container } = render(<TextBlock {...defaultProps} text={multilineText} />);

      const paragraph = container.querySelector("p");
      expect(paragraph?.textContent).toBe(multilineText);
    });
  });

  // ========== Text Styling ==========

  describe("Text Styling", () => {
    it("should apply text color", () => {
      render(<TextBlock {...defaultProps} textColor="#FF0000" />);

      const text = screen.getByText("Sample text content");
      expect(text).toHaveStyle({ color: "#FF0000" });
    });

    it("should apply font size", () => {
      render(<TextBlock {...defaultProps} fontSize={24} />);

      const text = screen.getByText("Sample text content");
      expect(text).toHaveStyle({ fontSize: "24px" });
    });

    it("should apply left text alignment", () => {
      render(<TextBlock {...defaultProps} textAlign="left" />);

      const text = screen.getByText("Sample text content");
      expect(text).toHaveStyle({ textAlign: "left" });
    });

    it("should apply center text alignment", () => {
      render(<TextBlock {...defaultProps} textAlign="center" />);

      const text = screen.getByText("Sample text content");
      expect(text).toHaveStyle({ textAlign: "center" });
    });

    it("should apply right text alignment", () => {
      render(<TextBlock {...defaultProps} textAlign="right" />);

      const text = screen.getByText("Sample text content");
      expect(text).toHaveStyle({ textAlign: "right" });
    });
  });

  // ========== Container Styling ==========

  describe("Container Styling", () => {
    it("should apply background color", () => {
      const { container } = render(
        <TextBlock {...defaultProps} backgroundColor="#F0F0F0" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ backgroundColor: "#F0F0F0" });
    });

    it("should apply border color", () => {
      const { container } = render(
        <TextBlock {...defaultProps} borderColor="#FF0000" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ borderColor: "#FF0000" });
    });

    it("should apply border width", () => {
      const { container } = render(
        <TextBlock {...defaultProps} borderWidth={3} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ borderWidth: "3px" });
    });

    it("should apply border radius", () => {
      const { container } = render(
        <TextBlock {...defaultProps} borderRadius={16} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ borderRadius: "16px" });
    });

    it("should apply zero border width", () => {
      const { container } = render(
        <TextBlock {...defaultProps} borderWidth={0} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ borderWidth: "0px" });
    });

    it("should apply custom className", () => {
      const { container } = render(
        <TextBlock {...defaultProps} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });
  });

  // ========== Interactions ==========

  describe("Interactions", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      const { container } = render(
        <TextBlock {...defaultProps} onClick={handleClick} />
      );

      const wrapper = container.firstChild as HTMLElement;
      wrapper.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not crash when onClick is undefined", () => {
      const { container } = render(
        <TextBlock {...defaultProps} onClick={undefined} />
      );

      const wrapper = container.firstChild as HTMLElement;
      
      expect(() => wrapper.click()).not.toThrow();
    });
  });

  // ========== Edge Cases ==========

  describe("Edge Cases", () => {
    it("should handle very long text", () => {
      const longText = "A".repeat(1000);
      render(<TextBlock {...defaultProps} text={longText} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("should handle special characters", () => {
      const specialText = "<>&'\"@!#$%^&*()";
      render(<TextBlock {...defaultProps} text={specialText} />);

      expect(screen.getByText(specialText)).toBeInTheDocument();
    });

    it("should handle HTML-like text without rendering it", () => {
      const htmlText = "<script>alert('test')</script>";
      render(<TextBlock {...defaultProps} text={htmlText} />);

      expect(screen.getByText(htmlText)).toBeInTheDocument();
      expect(screen.queryByRole("script")).not.toBeInTheDocument();
    });

    it("should handle zero font size", () => {
      render(<TextBlock {...defaultProps} fontSize={0} />);

      const text = screen.getByText("Sample text content");
      expect(text).toHaveStyle({ fontSize: "0px" });
    });

    it("should handle very large font size", () => {
      render(<TextBlock {...defaultProps} fontSize={200} />);

      const text = screen.getByText("Sample text content");
      expect(text).toHaveStyle({ fontSize: "200px" });
    });

    it("should handle whitespace-only text", () => {
      const whitespaceText = "   \n   \t   ";
      const { container } = render(<TextBlock {...defaultProps} text={whitespaceText} />);

      const paragraph = container.querySelector("p");
      expect(paragraph?.textContent).toBe(whitespaceText);
    });

    it("should preserve line breaks with pre-wrap", () => {
      const { container } = render(<TextBlock {...defaultProps} text="Line 1\nLine 2" />);

      const text = container.querySelector("p") as HTMLElement;
      expect(text).toHaveStyle({ whiteSpace: "pre-wrap" });
      // textContent contains the text, whiteSpace style preserves formatting
      expect(text.textContent).toContain("Line 1");
      expect(text.textContent).toContain("Line 2");
    });

    it("should handle negative border width gracefully", () => {
      const { container } = render(
        <TextBlock {...defaultProps} borderWidth={-5} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ borderWidth: "-5px" });
    });
  });
});
