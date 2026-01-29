/**
 * Skeleton Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Skeleton component covering:
 * - Rendering
 * - Animation class (animate-pulse)
 * - Styling and className merge
 *
 * @module components/ui/__tests__/skeleton.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { Skeleton } from "../skeleton";

describe("Skeleton", () => {
  describe("Rendering", () => {
    it("renders a div element", () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton.tagName).toBe("DIV");
    });

    it("renders with children if provided", () => {
      render(<Skeleton data-testid="skeleton">Loading...</Skeleton>);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Animation", () => {
    it("applies animate-pulse class", () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("animate-pulse");
    });
  });

  describe("Styling", () => {
    it("applies rounded-md class", () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("rounded-md");
    });

    it("applies bg-muted class", () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("bg-muted");
    });

    it("merges custom className", () => {
      render(<Skeleton className="h-10 w-full" data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("h-10", "w-full");
      expect(skeleton).toHaveClass("animate-pulse", "bg-muted");
    });

    it("allows dimension customization", () => {
      render(<Skeleton className="h-4 w-[250px]" data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("h-4", "w-[250px]");
    });
  });

  describe("Props Forwarding", () => {
    it("forwards additional HTML attributes", () => {
      render(<Skeleton data-testid="skeleton" id="loading-skeleton" aria-label="Loading content" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveAttribute("id", "loading-skeleton");
      expect(skeleton).toHaveAttribute("aria-label", "Loading content");
    });
  });
});
