/**
 * Label Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Label component covering:
 * - Rendering and ref forwarding
 * - Styling (text-sm, font-medium, peer-disabled)
 * - htmlFor attribute integration
 *
 * @module components/ui/__tests__/label.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { createRef } from "react";
import { Label } from "../label";

describe("Label", () => {
  describe("Rendering", () => {
    it("renders with children", () => {
      render(<Label>Email Address</Label>);
      expect(screen.getByText("Email Address")).toBeInTheDocument();
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLLabelElement>();
      render(<Label ref={ref}>Test</Label>);
      expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    });

    it("renders as label element", () => {
      render(<Label data-testid="label">Test Label</Label>);
      const label = screen.getByTestId("label");
      expect(label.tagName).toBe("LABEL");
    });
  });

  describe("Styling", () => {
    it("applies text-sm class", () => {
      render(<Label data-testid="label">Styled</Label>);
      const label = screen.getByTestId("label");
      expect(label).toHaveClass("text-sm");
    });

    it("applies font-medium class", () => {
      render(<Label data-testid="label">Styled</Label>);
      const label = screen.getByTestId("label");
      expect(label).toHaveClass("font-medium");
    });

    it("applies leading-none class", () => {
      render(<Label data-testid="label">Styled</Label>);
      const label = screen.getByTestId("label");
      expect(label).toHaveClass("leading-none");
    });

    it("applies peer-disabled styles", () => {
      render(<Label data-testid="label">Styled</Label>);
      const label = screen.getByTestId("label");
      expect(label).toHaveClass("peer-disabled:cursor-not-allowed");
      expect(label).toHaveClass("peer-disabled:opacity-70");
    });

    it("merges custom className", () => {
      render(<Label className="custom-label" data-testid="label">Custom</Label>);
      const label = screen.getByTestId("label");
      expect(label).toHaveClass("custom-label");
      expect(label).toHaveClass("text-sm");
    });
  });

  describe("Attributes", () => {
    it("supports htmlFor attribute", () => {
      render(<Label htmlFor="email-input">Email</Label>);
      const label = screen.getByText("Email");
      expect(label).toHaveAttribute("for", "email-input");
    });

    it("forwards additional props", () => {
      render(<Label data-testid="label" id="my-label">Test</Label>);
      const label = screen.getByTestId("label");
      expect(label).toHaveAttribute("id", "my-label");
    });
  });
});
