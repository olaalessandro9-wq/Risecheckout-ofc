/**
 * Select Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Select components covering:
 * - SelectTrigger rendering and styling
 * - Controlled value state
 * - Component structure
 *
 * Note: Uses fireEvent instead of userEvent due to clipboard compatibility
 *
 * @module components/ui/__tests__/select.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { createRef } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectSeparator,
} from "../select";

describe("Select Components", () => {
  describe("SelectTrigger", () => {
    it("renders trigger button", () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      expect(screen.getByTestId("trigger")).toBeInTheDocument();
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <Select>
          <SelectTrigger ref={ref}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
        </Select>
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it("shows placeholder text", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
        </Select>
      );
      expect(screen.getByText("Choose an option")).toBeInTheDocument();
    });

    it("applies base styling classes", () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveClass("flex", "h-10", "w-full", "items-center", "justify-between", "rounded-md");
    });

    it("applies disabled styles when disabled", () => {
      render(
        <Select disabled>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toBeDisabled();
    });

    it("merges custom className", () => {
      render(
        <Select>
          <SelectTrigger className="custom-trigger" data-testid="trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveClass("custom-trigger");
    });

    it("contains chevron icon", () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByTestId("trigger");
      const svg = trigger.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Select Controlled State", () => {
    it("displays selected value", () => {
      render(
        <Select value="apple">
          <SelectTrigger>
            <SelectValue placeholder="Select fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByText("Apple")).toBeInTheDocument();
    });

    it("calls onValueChange when value changes", async () => {
      const handleChange = vi.fn();
      
      render(
        <Select onValueChange={handleChange}>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectContent>
        </Select>
      );
      
      fireEvent.click(screen.getByTestId("trigger"));
      fireEvent.click(screen.getByText("Banana"));
      
      expect(handleChange).toHaveBeenCalledWith("banana");
    });
  });

  describe("SelectItem", () => {
    it("renders item with text when open", async () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      
      fireEvent.click(screen.getByTestId("trigger"));
      expect(screen.getByText("Option 1")).toBeInTheDocument();
    });

    it("shows check icon when selected", async () => {
      render(
        <Select value="option1">
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" data-testid="item">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      
      fireEvent.click(screen.getByTestId("trigger"));
      const item = screen.getByTestId("item");
      expect(item).toHaveAttribute("data-state", "checked");
    });
  });

  describe("SelectLabel", () => {
    it("renders label text when open", async () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
      
      fireEvent.click(screen.getByTestId("trigger"));
      expect(screen.getByText("Fruits")).toBeInTheDocument();
    });
  });

  describe("SelectSeparator", () => {
    it("renders separator element when open", async () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
            <SelectSeparator data-testid="separator" />
            <SelectItem value="b">B</SelectItem>
          </SelectContent>
        </Select>
      );
      
      fireEvent.click(screen.getByTestId("trigger"));
      expect(screen.getByTestId("separator")).toBeInTheDocument();
    });
  });
});
