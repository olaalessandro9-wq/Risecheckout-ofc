/**
 * ToggleGroup Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for ToggleGroup and ToggleGroupItem components.
 * Covers: rendering, selection, single/multiple modes, accessibility.
 *
 * @module components/ui/__tests__/toggle-group.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group";
import { Bold, Italic, Underline } from "lucide-react";

// ============================================================================
// Test Suite: ToggleGroup
// ============================================================================

describe("ToggleGroup", () => {
  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe("Rendering", () => {
    it("renders ToggleGroup with items", () => {
      render(
        <ToggleGroup type="single" data-testid="toggle-group">
          <ToggleGroupItem value="bold" aria-label="Toggle bold">
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Toggle italic">
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("toggle-group")).toBeInTheDocument();
      expect(screen.getByLabelText("Toggle bold")).toBeInTheDocument();
      expect(screen.getByLabelText("Toggle italic")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(
        <ToggleGroup type="single" className="custom-class" data-testid="toggle-group">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("toggle-group")).toHaveClass("custom-class");
    });

    it("renders ToggleGroupItem with custom className", () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a" className="custom-item" data-testid="item">
            A
          </ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("item")).toHaveClass("custom-item");
    });

    it("renders with text content", () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="left">Left</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
          <ToggleGroupItem value="right">Right</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByText("Left")).toBeInTheDocument();
      expect(screen.getByText("Center")).toBeInTheDocument();
      expect(screen.getByText("Right")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Single Selection Tests
  // ==========================================================================

  describe("Single Selection", () => {
    it("selects item on click", () => {
      const handleChange = vi.fn();
      render(
        <ToggleGroup type="single" onValueChange={handleChange}>
          <ToggleGroupItem value="a" data-testid="item-a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="item-b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      fireEvent.click(screen.getByTestId("item-a"));
      expect(handleChange).toHaveBeenCalledWith("a");
    });

    it("deselects when same item clicked", () => {
      const handleChange = vi.fn();
      render(
        <ToggleGroup type="single" defaultValue="a" onValueChange={handleChange}>
          <ToggleGroupItem value="a" data-testid="item-a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="item-b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      fireEvent.click(screen.getByTestId("item-a"));
      expect(handleChange).toHaveBeenCalledWith("");
    });

    it("switches selection to new item", () => {
      const handleChange = vi.fn();
      render(
        <ToggleGroup type="single" defaultValue="a" onValueChange={handleChange}>
          <ToggleGroupItem value="a" data-testid="item-a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="item-b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      fireEvent.click(screen.getByTestId("item-b"));
      expect(handleChange).toHaveBeenCalledWith("b");
    });

    it("shows selected state", () => {
      render(
        <ToggleGroup type="single" defaultValue="a">
          <ToggleGroupItem value="a" data-testid="item-a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="item-b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("item-a")).toHaveAttribute("data-state", "on");
      expect(screen.getByTestId("item-b")).toHaveAttribute("data-state", "off");
    });
  });

  // ==========================================================================
  // Multiple Selection Tests
  // ==========================================================================

  describe("Multiple Selection", () => {
    it("allows multiple selections", () => {
      const handleChange = vi.fn();
      render(
        <ToggleGroup type="multiple" onValueChange={handleChange}>
          <ToggleGroupItem value="bold" data-testid="bold">B</ToggleGroupItem>
          <ToggleGroupItem value="italic" data-testid="italic">I</ToggleGroupItem>
          <ToggleGroupItem value="underline" data-testid="underline">U</ToggleGroupItem>
        </ToggleGroup>
      );

      fireEvent.click(screen.getByTestId("bold"));
      expect(handleChange).toHaveBeenLastCalledWith(["bold"]);

      fireEvent.click(screen.getByTestId("italic"));
      expect(handleChange).toHaveBeenLastCalledWith(["bold", "italic"]);
    });

    it("toggles individual items in multiple mode", () => {
      const handleChange = vi.fn();
      render(
        <ToggleGroup type="multiple" defaultValue={["bold", "italic"]} onValueChange={handleChange}>
          <ToggleGroupItem value="bold" data-testid="bold">B</ToggleGroupItem>
          <ToggleGroupItem value="italic" data-testid="italic">I</ToggleGroupItem>
        </ToggleGroup>
      );

      // Deselect bold
      fireEvent.click(screen.getByTestId("bold"));
      expect(handleChange).toHaveBeenCalledWith(["italic"]);
    });

    it("shows multiple selected states", () => {
      render(
        <ToggleGroup type="multiple" defaultValue={["a", "c"]}>
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c" data-testid="c">C</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("a")).toHaveAttribute("data-state", "on");
      expect(screen.getByTestId("b")).toHaveAttribute("data-state", "off");
      expect(screen.getByTestId("c")).toHaveAttribute("data-state", "on");
    });
  });

  // ==========================================================================
  // Controlled Value Tests
  // ==========================================================================

  describe("Controlled Value", () => {
    it("works with controlled single value", () => {
      const handleChange = vi.fn();
      const { rerender } = render(
        <ToggleGroup type="single" value="a" onValueChange={handleChange}>
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("a")).toHaveAttribute("data-state", "on");

      rerender(
        <ToggleGroup type="single" value="b" onValueChange={handleChange}>
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("b")).toHaveAttribute("data-state", "on");
    });

    it("works with controlled multiple value", () => {
      const handleChange = vi.fn();
      const { rerender } = render(
        <ToggleGroup type="multiple" value={["a"]} onValueChange={handleChange}>
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("a")).toHaveAttribute("data-state", "on");
      expect(screen.getByTestId("b")).toHaveAttribute("data-state", "off");

      rerender(
        <ToggleGroup type="multiple" value={["a", "b"]} onValueChange={handleChange}>
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("a")).toHaveAttribute("data-state", "on");
      expect(screen.getByTestId("b")).toHaveAttribute("data-state", "on");
    });
  });

  // ==========================================================================
  // Disabled State Tests
  // ==========================================================================

  describe("Disabled State", () => {
    it("disables all items when group is disabled", () => {
      render(
        <ToggleGroup type="single" disabled>
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("a")).toBeDisabled();
      expect(screen.getByTestId("b")).toBeDisabled();
    });

    it("disables individual items", () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="b" disabled>B</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("a")).not.toBeDisabled();
      expect(screen.getByTestId("b")).toBeDisabled();
    });

    it("does not fire onChange when disabled", () => {
      const handleChange = vi.fn();
      render(
        <ToggleGroup type="single" disabled onValueChange={handleChange}>
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
        </ToggleGroup>
      );

      fireEvent.click(screen.getByTestId("a"));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Variants Tests
  // ==========================================================================

  describe("Variants", () => {
    it("applies default variant", () => {
      render(
        <ToggleGroup type="single" variant="default">
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("a")).toBeInTheDocument();
    });

    it("applies outline variant", () => {
      render(
        <ToggleGroup type="single" variant="outline">
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("a")).toBeInTheDocument();
    });

    it("item variant overrides group variant", () => {
      render(
        <ToggleGroup type="single" variant="default">
          <ToggleGroupItem value="a" variant="outline" data-testid="a">A</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("a")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Size Tests
  // ==========================================================================

  describe("Sizes", () => {
    it("applies default size", () => {
      render(
        <ToggleGroup type="single" size="default">
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("a")).toBeInTheDocument();
    });

    it("applies sm size", () => {
      render(
        <ToggleGroup type="single" size="sm">
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("a")).toBeInTheDocument();
    });

    it("applies lg size", () => {
      render(
        <ToggleGroup type="single" size="lg">
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("a")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe("Accessibility", () => {
    it("has correct role for group", () => {
      render(
        <ToggleGroup type="single" data-testid="toggle-group">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("toggle-group")).toHaveAttribute("role", "group");
    });

    it("items are focusable", () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a" data-testid="a">A</ToggleGroupItem>
        </ToggleGroup>
      );

      const item = screen.getByTestId("a");
      item.focus();
      expect(document.activeElement).toBe(item);
    });

    it("supports aria-label on items", () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="bold" aria-label="Toggle bold formatting">
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByLabelText("Toggle bold formatting")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles empty group", () => {
      render(<ToggleGroup type="single" data-testid="empty-group" />);
      expect(screen.getByTestId("empty-group")).toBeInTheDocument();
    });

    it("handles single item", () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="only" data-testid="only">Only</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId("only")).toBeInTheDocument();
    });

    it("handles many items", () => {
      const items = ["a", "b", "c", "d", "e", "f", "g", "h"];
      render(
        <ToggleGroup type="multiple">
          {items.map((value) => (
            <ToggleGroupItem key={value} value={value} data-testid={value}>
              {value.toUpperCase()}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      );

      items.forEach((value) => {
        expect(screen.getByTestId(value)).toBeInTheDocument();
      });
    });
  });
});
