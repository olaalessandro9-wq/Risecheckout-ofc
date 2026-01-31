/**
 * @file VideoEmbed-urls.test.tsx
 * @description Tests for VideoEmbed URL Handling
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { VideoEmbed, type VideoEmbedProps } from "../VideoEmbed";

describe("VideoEmbed - URLs", () => {
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

  describe("Rendering", () => {
    it("should render iframe when videoUrl is provided", () => {
      render(<VideoEmbed {...defaultProps} />);

      const iframe = screen.getByTitle("Video embed");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/dQw4w9WgXcQ");
    });

    it("should render placeholder when videoUrl is empty", () => {
      render(<VideoEmbed {...defaultProps} videoUrl="" />);

      expect(screen.getByText("Vídeo - Clique para configurar")).toBeInTheDocument();
      expect(screen.queryByTitle("Video embed")).not.toBeInTheDocument();
    });

    it("should render with custom placeholder text", () => {
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl=""
          placeholderText="Custom placeholder"
        />
      );

      expect(screen.getByText("Custom placeholder")).toBeInTheDocument();
    });
  });

  describe("YouTube URLs", () => {
    it("should convert standard YouTube URL to embed URL", () => {
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl="https://www.youtube.com/watch?v=abc123"
          videoType="youtube"
        />
      );

      const iframe = screen.getByTitle("Video embed");
      expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/abc123");
    });

    it("should convert short YouTube URL to embed URL", () => {
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl="https://youtu.be/xyz789"
          videoType="youtube"
        />
      );

      const iframe = screen.getByTitle("Video embed");
      expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/xyz789");
    });

    it("should handle YouTube URL with additional parameters", () => {
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl="https://www.youtube.com/watch?v=abc123&t=30s"
          videoType="youtube"
        />
      );

      const iframe = screen.getByTitle("Video embed");
      expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/abc123");
    });

    it("should show placeholder for invalid YouTube URL", () => {
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl="https://www.youtube.com/invalid"
          videoType="youtube"
        />
      );

      expect(screen.getByText("Vídeo - Clique para configurar")).toBeInTheDocument();
    });
  });

  describe("Vimeo URLs", () => {
    it("should convert Vimeo URL to embed URL", () => {
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl="https://vimeo.com/123456789"
          videoType="vimeo"
        />
      );

      const iframe = screen.getByTitle("Video embed");
      expect(iframe).toHaveAttribute("src", "https://player.vimeo.com/video/123456789");
    });

    it("should show placeholder for invalid Vimeo URL", () => {
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl="https://vimeo.com/invalid"
          videoType="vimeo"
        />
      );

      expect(screen.getByText("Vídeo - Clique para configurar")).toBeInTheDocument();
    });
  });

  describe("Custom URLs", () => {
    it("should use custom URL directly", () => {
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl="https://example.com/video.mp4"
          videoType="custom"
        />
      );

      const iframe = screen.getByTitle("Video embed");
      expect(iframe).toHaveAttribute("src", "https://example.com/video.mp4");
    });

    it("should use other type URL directly", () => {
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl="https://example.com/embed/video"
          videoType="other"
        />
      );

      const iframe = screen.getByTitle("Video embed");
      expect(iframe).toHaveAttribute("src", "https://example.com/embed/video");
    });
  });

  describe("Edge Cases", () => {
    it("should handle whitespace-only videoUrl as empty", () => {
      render(<VideoEmbed {...defaultProps} videoUrl="   " />);

      expect(screen.getByText("Vídeo - Clique para configurar")).toBeInTheDocument();
    });

    it("should handle malformed URLs gracefully", () => {
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl="not-a-url"
          videoType="youtube"
        />
      );

      expect(screen.getByText("Vídeo - Clique para configurar")).toBeInTheDocument();
    });

    it("should handle undefined placeholderText with default", () => {
      render(
        <VideoEmbed
          {...defaultProps}
          videoUrl=""
          placeholderText={undefined}
        />
      );

      expect(screen.getByText("Vídeo - Clique para configurar")).toBeInTheDocument();
    });
  });
});
