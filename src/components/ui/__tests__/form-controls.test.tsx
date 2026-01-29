/**
 * Form Controls Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Toggle, ToggleGroup, RadioGroup covering:
 * - Rendering and ref forwarding
 * - Variants and sizes
 * - Controlled state
 * - User interactions
 *
 * Note: Uses fireEvent instead of userEvent due to clipboard compatibility
 *
 * @module components/ui/__tests__/form-controls.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { createRef } from "react";
import { Toggle } from "../toggle";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group";
import { RadioGroup, RadioGroupItem } from "../radio-group";

describe("Toggle", () => {
  describe("Rendering", () => {
    it("renders toggle button", () => {
      render(<Toggle data-testid="toggle">Bold</Toggle>);
      expect(screen.getByTestId("toggle")).toBeInTheDocument();
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Toggle ref={ref}>Test</Toggle>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it("renders with children", () => {
      render(<Toggle>Toggle Text</Toggle>);
      expect(screen.getByText("Toggle Text")).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("applies default variant classes", () => {
      render(<Toggle data-testid="toggle">Default</Toggle>);
      const toggle = screen.getByTestId("toggle");
      expect(toggle).toHaveClass("bg-transparent");
    });

    it("applies outline variant classes", () => {
      render(<Toggle variant="outline" data-testid="toggle">Outline</Toggle>);
      const toggle = screen.getByTestId("toggle");
      expect(toggle).toHaveClass("border", "border-input");
    });
  });

  describe("Sizes", () => {
    it("applies default size classes", () => {
      render(<Toggle data-testid="toggle">Default</Toggle>);
      const toggle = screen.getByTestId("toggle");
      expect(toggle).toHaveClass("h-10", "px-3");
    });

    it("applies sm size classes", () => {
      render(<Toggle size="sm" data-testid="toggle">Small</Toggle>);
      const toggle = screen.getByTestId("toggle");
      expect(toggle).toHaveClass("h-9", "px-2.5");
    });

    it("applies lg size classes", () => {
      render(<Toggle size="lg" data-testid="toggle">Large</Toggle>);
      const toggle = screen.getByTestId("toggle");
      expect(toggle).toHaveClass("h-11", "px-5");
    });
  });

  describe("State", () => {
    it("handles pressed state", async () => {
      render(<Toggle data-testid="toggle">Toggle</Toggle>);
      const toggle = screen.getByTestId("toggle");
      
      expect(toggle).toHaveAttribute("data-state", "off");
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("data-state", "on");
    });

    it("calls onPressedChange when toggled", async () => {
      const handleChange = vi.fn();
      render(<Toggle onPressedChange={handleChange} data-testid="toggle">Toggle</Toggle>);
      
      fireEvent.click(screen.getByTestId("toggle"));
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("handles disabled state", () => {
      render(<Toggle disabled data-testid="toggle">Disabled</Toggle>);
      const toggle = screen.getByTestId("toggle");
      expect(toggle).toBeDisabled();
    });
  });
});

describe("ToggleGroup", () => {
  describe("Rendering", () => {
    it("renders toggle group with items", () => {
      render(
        <ToggleGroup type="single" data-testid="group">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(screen.getByTestId("group")).toBeInTheDocument();
      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B")).toBeInTheDocument();
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ToggleGroup type="single" ref={ref}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("applies flex layout", () => {
      render(
        <ToggleGroup type="single" data-testid="group">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      const group = screen.getByTestId("group");
      expect(group).toHaveClass("flex", "items-center", "justify-center", "gap-1");
    });
  });

  describe("Single Selection", () => {
    it("selects single item", async () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a" data-testid="item-a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="item-b">B</ToggleGroupItem>
        </ToggleGroup>
      );
      
      fireEvent.click(screen.getByTestId("item-a"));
      expect(screen.getByTestId("item-a")).toHaveAttribute("data-state", "on");
      expect(screen.getByTestId("item-b")).toHaveAttribute("data-state", "off");
    });

    it("calls onValueChange", async () => {
      const handleChange = vi.fn();
      render(
        <ToggleGroup type="single" onValueChange={handleChange}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      
      fireEvent.click(screen.getByText("A"));
      expect(handleChange).toHaveBeenCalledWith("a");
    });
  });

  describe("Multiple Selection", () => {
    it("allows multiple items selected", async () => {
      render(
        <ToggleGroup type="multiple">
          <ToggleGroupItem value="a" data-testid="item-a">A</ToggleGroupItem>
          <ToggleGroupItem value="b" data-testid="item-b">B</ToggleGroupItem>
        </ToggleGroup>
      );
      
      fireEvent.click(screen.getByTestId("item-a"));
      fireEvent.click(screen.getByTestId("item-b"));
      expect(screen.getByTestId("item-a")).toHaveAttribute("data-state", "on");
      expect(screen.getByTestId("item-b")).toHaveAttribute("data-state", "on");
    });
  });
});

describe("RadioGroup", () => {
  describe("Rendering", () => {
    it("renders radio group with items", () => {
      render(
        <RadioGroup data-testid="group">
          <RadioGroupItem value="option1" data-testid="radio1" />
          <RadioGroupItem value="option2" data-testid="radio2" />
        </RadioGroup>
      );
      expect(screen.getByTestId("group")).toBeInTheDocument();
      expect(screen.getByTestId("radio1")).toBeInTheDocument();
      expect(screen.getByTestId("radio2")).toBeInTheDocument();
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <RadioGroup ref={ref}>
          <RadioGroupItem value="a" />
        </RadioGroup>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("applies grid layout", () => {
      render(
        <RadioGroup data-testid="group">
          <RadioGroupItem value="a" />
        </RadioGroup>
      );
      const group = screen.getByTestId("group");
      expect(group).toHaveClass("grid", "gap-2");
    });
  });

  describe("Selection", () => {
    it("selects radio item on click", async () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="a" data-testid="radio-a" />
          <RadioGroupItem value="b" data-testid="radio-b" />
        </RadioGroup>
      );
      
      fireEvent.click(screen.getByTestId("radio-a"));
      expect(screen.getByTestId("radio-a")).toHaveAttribute("data-state", "checked");
      expect(screen.getByTestId("radio-b")).toHaveAttribute("data-state", "unchecked");
    });

    it("calls onValueChange when selection changes", async () => {
      const handleChange = vi.fn();
      render(
        <RadioGroup onValueChange={handleChange}>
          <RadioGroupItem value="option1" data-testid="radio1" />
        </RadioGroup>
      );
      
      fireEvent.click(screen.getByTestId("radio1"));
      expect(handleChange).toHaveBeenCalledWith("option1");
    });

    it("only allows single selection", async () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="a" data-testid="radio-a" />
          <RadioGroupItem value="b" data-testid="radio-b" />
        </RadioGroup>
      );
      
      fireEvent.click(screen.getByTestId("radio-a"));
      fireEvent.click(screen.getByTestId("radio-b"));
      expect(screen.getByTestId("radio-a")).toHaveAttribute("data-state", "unchecked");
      expect(screen.getByTestId("radio-b")).toHaveAttribute("data-state", "checked");
    });
  });

  describe("RadioGroupItem Styling", () => {
    it("applies base styling classes", () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="a" data-testid="radio" />
        </RadioGroup>
      );
      const radio = screen.getByTestId("radio");
      expect(radio).toHaveClass("aspect-square", "h-4", "w-4", "rounded-full", "border", "border-primary");
    });

    it("handles disabled state", () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="a" disabled data-testid="radio" />
        </RadioGroup>
      );
      const radio = screen.getByTestId("radio");
      expect(radio).toBeDisabled();
    });
  });
});
