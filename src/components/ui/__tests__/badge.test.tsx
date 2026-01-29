/**
 * Badge Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Badge component covering:
 * - Rendering
 * - All 4 variants (default, secondary, destructive, outline)
 * - Styling classes
 *
 * @module components/ui/__tests__/badge.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { Badge } from "../badge";

describe("Badge", () => {
  describe("Rendering", () => {
    it("renders with children", () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("merges custom className", () => {
      render(<Badge className="custom-badge" data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("custom-badge");
    });
  });

  describe("Variants", () => {
    it("applies default variant classes", () => {
      render(<Badge data-testid="badge">Default</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("bg-primary", "text-primary-foreground");
    });

    it("applies secondary variant classes", () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("bg-secondary", "text-secondary-foreground");
    });

    it("applies destructive variant classes", () => {
      render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("bg-destructive", "text-destructive-foreground");
    });

    it("applies outline variant classes", () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("text-foreground");
    });
  });

  describe("Styling", () => {
    it("applies rounded-full", () => {
      render(<Badge data-testid="badge">Rounded</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("rounded-full");
    });

    it("applies px-2.5 py-0.5", () => {
      render(<Badge data-testid="badge">Padded</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("px-2.5", "py-0.5");
    });

    it("applies text-xs font-semibold", () => {
      render(<Badge data-testid="badge">Styled</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("text-xs", "font-semibold");
    });

    it("applies border and inline-flex", () => {
      render(<Badge data-testid="badge">Flex</Badge>);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("inline-flex", "items-center", "border");
    });
  });
});
