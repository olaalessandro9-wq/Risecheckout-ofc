/**
 * Input Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Input component covering:
 * - Rendering and ref forwarding
 * - Input types (text, password, email, number)
 * - States (disabled, onChange)
 * - Styling and className merge
 * - Accessibility attributes
 *
 * @module components/ui/__tests__/input.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { createRef } from "react";
import { Input } from "../input";

describe("Input", () => {
  describe("Rendering", () => {
    it("renders input element", () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("renders with displayName", () => {
      expect(Input.displayName).toBe("Input");
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe("Types", () => {
    it("renders as text input by default", () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId("input") as HTMLInputElement;
      // Input without type attribute defaults to text behavior
      expect(input.type).toBe("text");
    });

    it("renders password type", () => {
      render(<Input type="password" data-testid="input" />);
      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "password");
    });

    it("renders email type", () => {
      render(<Input type="email" data-testid="input" />);
      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "email");
    });

    it("renders number type", () => {
      render(<Input type="number" data-testid="input" />);
      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "number");
    });
  });

  describe("States", () => {
    it("applies disabled styles when disabled", () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId("input");
      expect(input).toBeDisabled();
      expect(input).toHaveClass("disabled:cursor-not-allowed", "disabled:opacity-50");
    });

    it("prevents input when disabled", () => {
      render(<Input disabled data-testid="input" value="" readOnly />);
      const input = screen.getByTestId("input");
      expect(input).toBeDisabled();
      expect(input).toHaveValue("");
    });

    it("handles onChange callback", () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} data-testid="input" />);
      const input = screen.getByTestId("input");
      fireEvent.change(input, { target: { value: "a" } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("merges custom className", () => {
      render(<Input className="custom-input" data-testid="input" />);
      const input = screen.getByTestId("input");
      expect(input).toHaveClass("custom-input");
    });

    it("applies base styling classes", () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId("input");
      expect(input).toHaveClass("flex", "h-10", "w-full", "rounded-md", "border");
    });

    it("applies focus-visible styles", () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId("input");
      expect(input).toHaveClass("focus-visible:outline-none", "focus-visible:ring-2");
    });
  });

  describe("Attributes", () => {
    it("forwards aria attributes", () => {
      render(
        <Input
          aria-label="Test input"
          aria-describedby="description"
          data-testid="input"
        />
      );
      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("aria-label", "Test input");
      expect(input).toHaveAttribute("aria-describedby", "description");
    });

    it("forwards placeholder", () => {
      render(<Input placeholder="Enter value" />);
      expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
    });
  });
});
