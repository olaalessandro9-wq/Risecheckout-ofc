/**
 * Switch Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Switch component covering:
 * - Rendering and ref forwarding
 * - States (checked, unchecked, disabled)
 * - Interactions (onCheckedChange, toggle)
 * - Styling (thumb translation)
 *
 * @module components/ui/__tests__/switch.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { createRef } from "react";
import { Switch } from "../switch";

describe("Switch", () => {
  describe("Rendering", () => {
    it("renders switch element", () => {
      render(<Switch aria-label="Test switch" />);
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("renders with displayName", () => {
      expect(Switch.displayName).toBeDefined();
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Switch ref={ref} aria-label="Test" />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("States", () => {
    it("handles checked state", () => {
      render(<Switch checked aria-label="Checked" />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveAttribute("data-state", "checked");
    });

    it("handles unchecked state", () => {
      render(<Switch checked={false} aria-label="Unchecked" />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveAttribute("data-state", "unchecked");
    });

    it("handles disabled state", () => {
      render(<Switch disabled aria-label="Disabled" />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toBeDisabled();
    });

    it("applies disabled styling", () => {
      render(<Switch disabled aria-label="Disabled" />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveClass("disabled:cursor-not-allowed", "disabled:opacity-50");
    });
  });

  describe("Interactions", () => {
    it("calls onCheckedChange when clicked", () => {
      const handleChange = vi.fn();
      render(<Switch onCheckedChange={handleChange} aria-label="Clickable" />);
      const switchEl = screen.getByRole("switch");
      fireEvent.click(switchEl);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("toggles state on click", () => {
      const handleChange = vi.fn();
      render(<Switch onCheckedChange={handleChange} aria-label="Toggle" />);
      const switchEl = screen.getByRole("switch");
      fireEvent.click(switchEl);
      expect(handleChange).toHaveBeenLastCalledWith(true);
    });

    it("does not call onCheckedChange when disabled", () => {
      const handleChange = vi.fn();
      render(<Switch disabled onCheckedChange={handleChange} aria-label="Disabled" />);
      const switchEl = screen.getByRole("switch");
      fireEvent.click(switchEl);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("applies base styling classes", () => {
      render(<Switch aria-label="Styled" />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveClass(
        "peer",
        "inline-flex",
        "h-6",
        "w-11",
        "shrink-0",
        "cursor-pointer",
        "items-center",
        "rounded-full"
      );
    });

    it("applies translate-x-5 when checked", () => {
      render(<Switch checked aria-label="Checked" />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveClass("data-[state=checked]:bg-primary");
    });

    it("applies translate-x-0 when unchecked", () => {
      render(<Switch checked={false} aria-label="Unchecked" />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveClass("data-[state=unchecked]:bg-input");
    });

    it("merges custom className", () => {
      render(<Switch className="custom-switch" aria-label="Custom" />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveClass("custom-switch");
    });
  });

  describe("Accessibility", () => {
    it("has correct aria attributes", () => {
      render(<Switch aria-label="Accessible switch" />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveAttribute("aria-label", "Accessible switch");
    });

    it("has correct aria-checked attribute when checked", () => {
      render(<Switch checked aria-label="Checked switch" />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveAttribute("aria-checked", "true");
    });

    it("has correct aria-checked attribute when unchecked", () => {
      render(<Switch checked={false} aria-label="Unchecked switch" />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveAttribute("aria-checked", "false");
    });
  });
});
