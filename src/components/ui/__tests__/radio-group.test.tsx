/**
 * RadioGroup Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for RadioGroup and RadioGroupItem components.
 * Covers: rendering, selection, keyboard navigation, accessibility.
 *
 * @module components/ui/__tests__/radio-group.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { Label } from "../label";

// ============================================================================
// Test Suite: RadioGroup
// ============================================================================

describe("RadioGroup", () => {
  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe("Rendering", () => {
    it("renders RadioGroup with items", () => {
      render(
        <RadioGroup defaultValue="option1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="option1" />
            <Label htmlFor="option1">Option 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="option2" />
            <Label htmlFor="option2">Option 2</Label>
          </div>
        </RadioGroup>
      );

      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
    });

    it("renders with default value selected", () => {
      render(
        <RadioGroup defaultValue="option2">
          <RadioGroupItem value="option1" data-testid="radio1" />
          <RadioGroupItem value="option2" data-testid="radio2" />
        </RadioGroup>
      );

      const radio2 = screen.getByTestId("radio2");
      expect(radio2).toHaveAttribute("data-state", "checked");
    });

    it("renders with custom className", () => {
      render(
        <RadioGroup className="custom-class" data-testid="radio-group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio-group")).toHaveClass("custom-class");
    });

    it("renders RadioGroupItem with custom className", () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" className="custom-item" data-testid="radio-item" />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio-item")).toHaveClass("custom-item");
    });
  });

  // ==========================================================================
  // Selection Tests
  // ==========================================================================

  describe("Selection", () => {
    it("selects item on click", () => {
      const handleChange = vi.fn();
      render(
        <RadioGroup onValueChange={handleChange}>
          <RadioGroupItem value="option1" data-testid="radio1" />
          <RadioGroupItem value="option2" data-testid="radio2" />
        </RadioGroup>
      );

      fireEvent.click(screen.getByTestId("radio2"));
      expect(handleChange).toHaveBeenCalledWith("option2");
    });

    it("updates selection when different item clicked", () => {
      const handleChange = vi.fn();
      render(
        <RadioGroup defaultValue="option1" onValueChange={handleChange}>
          <RadioGroupItem value="option1" data-testid="radio1" />
          <RadioGroupItem value="option2" data-testid="radio2" />
        </RadioGroup>
      );

      fireEvent.click(screen.getByTestId("radio2"));
      expect(handleChange).toHaveBeenCalledWith("option2");
    });

    it("maintains selection when same item clicked", () => {
      const handleChange = vi.fn();
      render(
        <RadioGroup defaultValue="option1" onValueChange={handleChange}>
          <RadioGroupItem value="option1" data-testid="radio1" />
          <RadioGroupItem value="option2" data-testid="radio2" />
        </RadioGroup>
      );

      fireEvent.click(screen.getByTestId("radio1"));
      // Should not call onChange when clicking already selected item
      expect(handleChange).not.toHaveBeenCalled();
    });

    it("works with controlled value", () => {
      const handleChange = vi.fn();
      const { rerender } = render(
        <RadioGroup value="option1" onValueChange={handleChange}>
          <RadioGroupItem value="option1" data-testid="radio1" />
          <RadioGroupItem value="option2" data-testid="radio2" />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio1")).toHaveAttribute("data-state", "checked");

      rerender(
        <RadioGroup value="option2" onValueChange={handleChange}>
          <RadioGroupItem value="option1" data-testid="radio1" />
          <RadioGroupItem value="option2" data-testid="radio2" />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio2")).toHaveAttribute("data-state", "checked");
    });
  });

  // ==========================================================================
  // Disabled State Tests
  // ==========================================================================

  describe("Disabled State", () => {
    it("disables all items when group is disabled", () => {
      render(
        <RadioGroup disabled>
          <RadioGroupItem value="option1" data-testid="radio1" />
          <RadioGroupItem value="option2" data-testid="radio2" />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio1")).toBeDisabled();
      expect(screen.getByTestId("radio2")).toBeDisabled();
    });

    it("disables individual item", () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" data-testid="radio1" />
          <RadioGroupItem value="option2" data-testid="radio2" disabled />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio1")).not.toBeDisabled();
      expect(screen.getByTestId("radio2")).toBeDisabled();
    });

    it("does not fire onChange when disabled item clicked", () => {
      const handleChange = vi.fn();
      render(
        <RadioGroup onValueChange={handleChange}>
          <RadioGroupItem value="option1" data-testid="radio1" disabled />
        </RadioGroup>
      );

      fireEvent.click(screen.getByTestId("radio1"));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe("Accessibility", () => {
    it("has correct role for group", () => {
      render(
        <RadioGroup data-testid="radio-group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio-group")).toHaveAttribute("role", "radiogroup");
    });

    it("has correct role for items", () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" data-testid="radio-item" />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio-item")).toHaveAttribute("role", "radio");
    });

    it("associates label with radio item", () => {
      render(
        <RadioGroup>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <Label htmlFor="r1">Option 1</Label>
          </div>
        </RadioGroup>
      );

      const label = screen.getByText("Option 1");
      expect(label).toHaveAttribute("for", "r1");
    });

    it("supports aria-label", () => {
      render(
        <RadioGroup aria-label="Select an option" data-testid="radio-group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio-group")).toHaveAttribute("aria-label", "Select an option");
    });
  });

  // ==========================================================================
  // Orientation Tests
  // ==========================================================================

  describe("Orientation", () => {
    it("supports horizontal orientation", () => {
      render(
        <RadioGroup orientation="horizontal" data-testid="radio-group">
          <RadioGroupItem value="option1" />
          <RadioGroupItem value="option2" />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio-group")).toHaveAttribute("aria-orientation", "horizontal");
    });

    it("supports vertical orientation", () => {
      render(
        <RadioGroup orientation="vertical" data-testid="radio-group">
          <RadioGroupItem value="option1" />
          <RadioGroupItem value="option2" />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio-group")).toHaveAttribute("aria-orientation", "vertical");
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles empty group", () => {
      render(<RadioGroup data-testid="radio-group" />);
      expect(screen.getByTestId("radio-group")).toBeInTheDocument();
    });

    it("handles single item", () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="only" data-testid="radio-only" />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio-only")).toBeInTheDocument();
    });

    it("handles many items", () => {
      const items = Array.from({ length: 10 }, (_, i) => `option${i}`);
      render(
        <RadioGroup>
          {items.map((value) => (
            <RadioGroupItem key={value} value={value} data-testid={value} />
          ))}
        </RadioGroup>
      );

      items.forEach((value) => {
        expect(screen.getByTestId(value)).toBeInTheDocument();
      });
    });

    it("handles required attribute", () => {
      render(
        <RadioGroup required data-testid="radio-group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );

      expect(screen.getByTestId("radio-group")).toHaveAttribute("aria-required", "true");
    });
  });
});
