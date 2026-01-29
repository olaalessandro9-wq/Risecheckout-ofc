/**
 * Checkbox Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Checkbox component covering:
 * - Rendering and ref forwarding
 * - States (checked, unchecked, disabled)
 * - Interactions (onCheckedChange, toggle)
 * - Accessibility
 *
 * @module components/ui/__tests__/checkbox.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { createRef } from "react";
import { Checkbox } from "../checkbox";

describe("Checkbox", () => {
  describe("Rendering", () => {
    it("renders checkbox element", () => {
      render(<Checkbox aria-label="Test checkbox" />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("renders with displayName", () => {
      expect(Checkbox.displayName).toBeDefined();
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Checkbox ref={ref} aria-label="Test" />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("States", () => {
    it("handles checked state", () => {
      render(<Checkbox checked aria-label="Checked" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("data-state", "checked");
    });

    it("handles unchecked state", () => {
      render(<Checkbox checked={false} aria-label="Unchecked" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("data-state", "unchecked");
    });

    it("handles disabled state", () => {
      render(<Checkbox disabled aria-label="Disabled" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeDisabled();
    });

    it("applies disabled styling", () => {
      render(<Checkbox disabled aria-label="Disabled" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("disabled:cursor-not-allowed", "disabled:opacity-50");
    });
  });

  describe("Interactions", () => {
    it("calls onCheckedChange when clicked", () => {
      const handleChange = vi.fn();
      render(<Checkbox onCheckedChange={handleChange} aria-label="Clickable" />);
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("toggles state on click", () => {
      const handleChange = vi.fn();
      render(<Checkbox onCheckedChange={handleChange} aria-label="Toggle" />);
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenLastCalledWith(true);
    });

    it("does not call onCheckedChange when disabled", () => {
      const handleChange = vi.fn();
      render(
        <Checkbox disabled onCheckedChange={handleChange} aria-label="Disabled" />
      );
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("applies base styling classes", () => {
      render(<Checkbox aria-label="Styled" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("peer", "h-4", "w-4", "shrink-0", "rounded-sm", "border");
    });

    it("merges custom className", () => {
      render(<Checkbox className="custom-checkbox" aria-label="Custom" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("custom-checkbox");
    });

    it("applies checked styling", () => {
      render(<Checkbox checked aria-label="Checked" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("data-[state=checked]:bg-primary");
    });
  });

  describe("Accessibility", () => {
    it("has correct aria attributes", () => {
      render(<Checkbox aria-label="Accessible checkbox" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("aria-label", "Accessible checkbox");
    });
  });
});
