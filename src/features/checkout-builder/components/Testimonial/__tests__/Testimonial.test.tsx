/**
 * @file Testimonial.test.tsx
 * @description Tests for Testimonial Component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { Testimonial, type TestimonialProps } from "../Testimonial";

describe("Testimonial", () => {
  const defaultProps: TestimonialProps = {
    testimonialText: "Este produto mudou minha vida!",
    authorName: "João Silva",
    authorImage: "https://example.com/avatar.jpg",
    backgroundColor: "#F9FAFB",
    textColor: "#374151",
    authorColor: "#6B7280",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== Rendering ==========

  describe("Rendering", () => {
    it("should render correctly with all props", () => {
      render(<Testimonial {...defaultProps} />);

      expect(screen.getByText('"Este produto mudou minha vida!"')).toBeInTheDocument();
      expect(screen.getByText("- João Silva")).toBeInTheDocument();
      
      const image = screen.getByRole("img");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "https://example.com/avatar.jpg");
      expect(image).toHaveAttribute("alt", "João Silva");
    });

    it("should render without author image", () => {
      render(<Testimonial {...defaultProps} authorImage={undefined} />);

      expect(screen.getByText('"Este produto mudou minha vida!"')).toBeInTheDocument();
      expect(screen.getByText("- João Silva")).toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("should render with empty testimonial text", () => {
      render(<Testimonial {...defaultProps} testimonialText="" />);

      expect(screen.getByText('""')).toBeInTheDocument();
      expect(screen.getByText("- João Silva")).toBeInTheDocument();
    });

    it("should render with custom content", () => {
      render(
        <Testimonial
          {...defaultProps}
          testimonialText="Amazing product!"
          authorName="Jane Doe"
        />
      );

      expect(screen.getByText('"Amazing product!"')).toBeInTheDocument();
      expect(screen.getByText("- Jane Doe")).toBeInTheDocument();
    });
  });

  // ========== Text Formatting ==========

  describe("Text Formatting", () => {
    it("should wrap testimonial text in quotes", () => {
      render(<Testimonial {...defaultProps} testimonialText="Great!" />);

      expect(screen.getByText('"Great!"')).toBeInTheDocument();
      expect(screen.queryByText("Great!")).not.toBeInTheDocument();
    });

    it("should prefix author name with dash", () => {
      render(<Testimonial {...defaultProps} authorName="John" />);

      expect(screen.getByText("- John")).toBeInTheDocument();
      expect(screen.queryByText("John")).not.toBeInTheDocument();
    });

    it("should apply italic style to testimonial text", () => {
      render(<Testimonial {...defaultProps} />);

      const testimonialText = screen.getByText('"Este produto mudou minha vida!"');
      expect(testimonialText).toHaveClass("italic");
    });
  });

  // ========== Styling ==========

  describe("Styling", () => {
    it("should apply background color", () => {
      const { container } = render(
        <Testimonial {...defaultProps} backgroundColor="#FFFFFF" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ backgroundColor: "#FFFFFF" });
    });

    it("should apply text color", () => {
      render(<Testimonial {...defaultProps} textColor="#000000" />);

      const testimonialText = screen.getByText('"Este produto mudou minha vida!"');
      expect(testimonialText).toHaveStyle({ color: "#000000" });
    });

    it("should apply author color", () => {
      render(<Testimonial {...defaultProps} authorColor="#FF0000" />);

      const authorName = screen.getByText("- João Silva");
      expect(authorName).toHaveStyle({ color: "#FF0000" });
    });

    it("should apply custom className", () => {
      const { container } = render(
        <Testimonial {...defaultProps} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });
  });

  // ========== Author Image ==========

  describe("Author Image", () => {
    it("should render author image with correct attributes", () => {
      render(<Testimonial {...defaultProps} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", "https://example.com/avatar.jpg");
      expect(image).toHaveAttribute("alt", "João Silva");
      expect(image).toHaveClass("w-12", "h-12", "rounded-full");
    });

    it("should not render image when authorImage is undefined", () => {
      render(<Testimonial {...defaultProps} authorImage={undefined} />);

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("should not render image when authorImage is empty string", () => {
      render(<Testimonial {...defaultProps} authorImage="" />);

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("should update alt text with author name", () => {
      render(
        <Testimonial
          {...defaultProps}
          authorName="Maria Santos"
        />
      );

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", "Maria Santos");
    });
  });

  // ========== Interactions ==========

  describe("Interactions", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      const { container } = render(
        <Testimonial {...defaultProps} onClick={handleClick} />
      );

      const wrapper = container.firstChild as HTMLElement;
      wrapper.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not crash when onClick is undefined", () => {
      const { container } = render(
        <Testimonial {...defaultProps} onClick={undefined} />
      );

      const wrapper = container.firstChild as HTMLElement;
      
      expect(() => wrapper.click()).not.toThrow();
    });
  });

  // ========== Edge Cases ==========

  describe("Edge Cases", () => {
    it("should handle very long testimonial text", () => {
      const longText = "A".repeat(1000);
      render(<Testimonial {...defaultProps} testimonialText={longText} />);

      expect(screen.getByText(`"${longText}"`)).toBeInTheDocument();
    });

    it("should handle very long author name", () => {
      const longName = "B".repeat(200);
      render(<Testimonial {...defaultProps} authorName={longName} />);

      expect(screen.getByText(`- ${longName}`)).toBeInTheDocument();
    });

    it("should handle special characters in testimonial", () => {
      const specialText = "<>&'@!#$%";
      render(<Testimonial {...defaultProps} testimonialText={specialText} />);

      expect(screen.getByText(`"${specialText}"`)).toBeInTheDocument();
    });

    it("should handle special characters in author name", () => {
      const specialName = "<>&'@";
      render(<Testimonial {...defaultProps} authorName={specialName} />);

      expect(screen.getByText(`- ${specialName}`)).toBeInTheDocument();
    });

    it("should handle HTML-like text without rendering it", () => {
      const htmlText = "<script>alert('test')</script>";
      render(<Testimonial {...defaultProps} testimonialText={htmlText} />);

      expect(screen.getByText(`"${htmlText}"`)).toBeInTheDocument();
      expect(screen.queryByRole("script")).not.toBeInTheDocument();
    });

    it("should handle multiline testimonial text", () => {
      const multilineText = "Line 1\nLine 2\nLine 3";
      const { container } = render(
        <Testimonial {...defaultProps} testimonialText={multilineText} />
      );

      const paragraph = container.querySelector("p.italic");
      expect(paragraph?.textContent).toContain("Line 1");
      expect(paragraph?.textContent).toContain("Line 2");
      expect(paragraph?.textContent).toContain("Line 3");
    });

    it("should handle invalid image URL gracefully", () => {
      render(<Testimonial {...defaultProps} authorImage="invalid-url" />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", "invalid-url");
    });
  });
});
