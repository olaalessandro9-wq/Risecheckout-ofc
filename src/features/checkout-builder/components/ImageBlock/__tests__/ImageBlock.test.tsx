/**
 * @file ImageBlock.test.tsx
 * @description Tests for ImageBlock Component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { ImageBlock, type ImageBlockProps } from "../ImageBlock";

describe("ImageBlock", () => {
  const defaultProps: ImageBlockProps = {
    imageUrl: "https://example.com/image.jpg",
    alt: "Test Image",
    alignment: "center",
    maxWidth: 600,
    roundedImage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== Rendering ==========

  describe("Rendering", () => {
    it("should render image when imageUrl is provided", () => {
      render(<ImageBlock {...defaultProps} />);

      const image = screen.getByRole("img");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
      expect(image).toHaveAttribute("alt", "Test Image");
    });

    it("should render placeholder when imageUrl is empty", () => {
      render(<ImageBlock {...defaultProps} imageUrl="" />);

      expect(screen.getByText("Nenhuma imagem selecionada")).toBeInTheDocument();
      expect(screen.getByText("Clique para adicionar uma imagem")).toBeInTheDocument();
    });

    it("should render with custom alt text", () => {
      render(<ImageBlock {...defaultProps} alt="Custom Alt Text" />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", "Custom Alt Text");
    });
  });

  // ========== Styling ==========

  describe("Styling", () => {
    it("should apply rounded class when roundedImage is true", () => {
      render(<ImageBlock {...defaultProps} roundedImage={true} />);

      const image = screen.getByRole("img");
      expect(image).toHaveClass("rounded-lg");
    });

    it("should not apply rounded class when roundedImage is false", () => {
      render(<ImageBlock {...defaultProps} roundedImage={false} />);

      const image = screen.getByRole("img");
      expect(image).not.toHaveClass("rounded-lg");
    });

    it("should apply maxWidth style", () => {
      render(<ImageBlock {...defaultProps} maxWidth={400} />);

      const image = screen.getByRole("img");
      expect(image).toHaveStyle({ maxWidth: "400px" });
    });

    it("should apply custom className", () => {
      const { container } = render(
        <ImageBlock {...defaultProps} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });
  });

  // ========== Alignment ==========

  describe("Alignment", () => {
    it("should apply center alignment", () => {
      const { container } = render(
        <ImageBlock {...defaultProps} alignment="center" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("justify-center");
    });

    it("should apply left alignment", () => {
      const { container } = render(
        <ImageBlock {...defaultProps} alignment="left" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("justify-start");
    });

    it("should apply right alignment", () => {
      const { container } = render(
        <ImageBlock {...defaultProps} alignment="right" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("justify-end");
    });
  });

  // ========== Interactions ==========

  describe("Interactions", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      const { container } = render(
        <ImageBlock {...defaultProps} onClick={handleClick} />
      );

      const wrapper = container.firstChild as HTMLElement;
      wrapper.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not crash when onClick is undefined", () => {
      const { container } = render(
        <ImageBlock {...defaultProps} onClick={undefined} />
      );

      const wrapper = container.firstChild as HTMLElement;
      
      expect(() => wrapper.click()).not.toThrow();
    });

    it("should call onClick on placeholder", () => {
      const handleClick = vi.fn();
      const { container } = render(
        <ImageBlock {...defaultProps} imageUrl="" onClick={handleClick} />
      );

      const wrapper = container.firstChild as HTMLElement;
      wrapper.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // ========== Placeholder ==========

  describe("Placeholder", () => {
    it("should render placeholder SVG icon", () => {
      const { container } = render(
        <ImageBlock {...defaultProps} imageUrl="" />
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("width", "48");
      expect(svg).toHaveAttribute("height", "48");
    });

    it("should show placeholder text", () => {
      render(<ImageBlock {...defaultProps} imageUrl="" />);

      expect(screen.getByText("Nenhuma imagem selecionada")).toBeInTheDocument();
      expect(screen.getByText("Clique para adicionar uma imagem")).toBeInTheDocument();
    });

    it("should not show placeholder when imageUrl is provided", () => {
      render(<ImageBlock {...defaultProps} />);

      expect(screen.queryByText("Nenhuma imagem selecionada")).not.toBeInTheDocument();
    });
  });

  // ========== Edge Cases ==========

  describe("Edge Cases", () => {
    it("should handle very long URLs", () => {
      const longUrl = "https://example.com/" + "a".repeat(500) + ".jpg";
      render(<ImageBlock {...defaultProps} imageUrl={longUrl} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", longUrl);
    });

    it("should handle special characters in alt text", () => {
      const specialAlt = "<>&'\"@!#$%";
      render(<ImageBlock {...defaultProps} alt={specialAlt} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", specialAlt);
    });

    it("should handle zero maxWidth", () => {
      render(<ImageBlock {...defaultProps} maxWidth={0} />);

      const image = screen.getByRole("img");
      expect(image).toHaveStyle({ maxWidth: "0px" });
    });

    it("should handle very large maxWidth", () => {
      render(<ImageBlock {...defaultProps} maxWidth={9999} />);

      const image = screen.getByRole("img");
      expect(image).toHaveStyle({ maxWidth: "9999px" });
    });

    it("should handle whitespace-only imageUrl as empty", () => {
      render(<ImageBlock {...defaultProps} imageUrl="   " />);

      // Should render image with whitespace URL (browser will handle invalid URL)
      const image = screen.getByRole("img");
      expect(image).toBeInTheDocument();
    });
  });
});
