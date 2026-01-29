/**
 * Separator Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Separator component covering:
 * - Rendering and ref forwarding
 * - Orientation (horizontal/vertical)
 * - Decorative attribute
 *
 * @module components/ui/__tests__/separator.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { createRef } from "react";
import { Separator } from "../separator";

describe("Separator", () => {
  describe("Rendering", () => {
    it("renders separator element", () => {
      render(<Separator data-testid="separator" />);
      expect(screen.getByTestId("separator")).toBeInTheDocument();
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(<Separator ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("renders with role=none by default (decorative)", () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("role", "none");
    });
  });

  describe("Orientation", () => {
    it("applies horizontal classes by default", () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-[1px]", "w-full");
    });

    it("applies horizontal classes when orientation=horizontal", () => {
      render(<Separator orientation="horizontal" data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-[1px]", "w-full");
    });

    it("applies vertical classes when orientation=vertical", () => {
      render(<Separator orientation="vertical" data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-full", "w-[1px]");
    });

    it("sets data-orientation attribute", () => {
      render(<Separator orientation="vertical" data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("data-orientation", "vertical");
    });
  });

  describe("Decorative", () => {
    it("has role=none when decorative (default)", () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("role", "none");
    });

    it("supports non-decorative mode", () => {
      render(<Separator decorative={false} data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).not.toHaveAttribute("aria-hidden");
    });
  });

  describe("Styling", () => {
    it("applies shrink-0 class", () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("shrink-0");
    });

    it("applies bg-border class", () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("bg-border");
    });

    it("merges custom className", () => {
      render(<Separator className="my-separator" data-testid="separator" />);
      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("my-separator");
      expect(separator).toHaveClass("bg-border");
    });
  });
});
