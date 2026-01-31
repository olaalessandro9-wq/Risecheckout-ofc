/**
 * @file VideoEmbed-style.test.tsx
 * @description Tests for VideoEmbed Styling and Interactions
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { VideoEmbed, type VideoEmbedProps } from "../VideoEmbed";

describe("VideoEmbed - Style & Interactions", () => {
  const defaultProps: VideoEmbedProps = {
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoType: "youtube",
    backgroundColor: "#F9FAFB",
    placeholderColor: "#9CA3AF",
    placeholderText: "Vídeo - Clique para configurar",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Iframe Attributes", () => {
    it("should have correct allow attributes", () => {
      render(<VideoEmbed {...defaultProps} />);

      const iframe = screen.getByTitle("Video embed");
      expect(iframe).toHaveAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      );
    });

    it("should have allowFullScreen attribute", () => {
      render(<VideoEmbed {...defaultProps} />);

      const iframe = screen.getByTitle("Video embed");
      expect(iframe).toHaveAttribute("allowFullScreen");
    });

    it("should have correct title", () => {
      render(<VideoEmbed {...defaultProps} />);

      const iframe = screen.getByTitle("Video embed");
      expect(iframe).toHaveAttribute("title", "Video embed");
    });
  });

  describe("Styling", () => {
    it("should apply background color", () => {
      const { container } = render(
        <VideoEmbed {...defaultProps} backgroundColor="#FFFFFF" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ backgroundColor: "#FFFFFF" });
    });

    it("should apply placeholder color to border", () => {
      const { container } = render(
        <VideoEmbed
          {...defaultProps}
          videoUrl=""
          placeholderColor="#FF0000"
        />
      );

      const placeholder = container.querySelector(".border-dashed") as HTMLElement;
      expect(placeholder).toHaveStyle({ borderColor: "#FF0000" });
    });

    it("should apply placeholder color to text", () => {
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl=""
          placeholderColor="#FF0000"
        />
      );

      const text = screen.getByText("Vídeo - Clique para configurar");
      expect(text).toHaveStyle({ color: "#FF0000" });
    });

    it("should apply custom className", () => {
      const { container } = render(
        <VideoEmbed {...defaultProps} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });
  });

  describe("Interactions", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      const { container } = render(
        <VideoEmbed {...defaultProps} onClick={handleClick} />
      );

      const wrapper = container.firstChild as HTMLElement;
      wrapper.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not crash when onClick is undefined", () => {
      const { container } = render(
        <VideoEmbed {...defaultProps} onClick={undefined} />
      );

      const wrapper = container.firstChild as HTMLElement;
      
      expect(() => wrapper.click()).not.toThrow();
    });

    it("should call onClick on placeholder", () => {
      const handleClick = vi.fn();
      const { container } = render(
        <VideoEmbed {...defaultProps} videoUrl="" onClick={handleClick} />
      );

      const wrapper = container.firstChild as HTMLElement;
      wrapper.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long placeholder text", () => {
      const longText = "A".repeat(500);
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl=""
          placeholderText={longText}
        />
      );

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("should handle special characters in placeholder", () => {
      const specialText = "<>&'\"@!#$%";
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl=""
          placeholderText={specialText}
        />
      );

      expect(screen.getByText(specialText)).toBeInTheDocument();
    });
  });
});
