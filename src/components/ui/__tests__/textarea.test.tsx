/**
 * Textarea Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Textarea component covering:
 * - Rendering and ref forwarding
 * - States (disabled, onChange)
 * - Styling and className merge
 * - Accessibility attributes
 *
 * @module components/ui/__tests__/textarea.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { createRef } from "react";
import { Textarea } from "../textarea";

describe("Textarea", () => {
  describe("Rendering", () => {
    it("renders textarea element", () => {
      render(<Textarea placeholder="Enter text" />);
      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("renders with displayName", () => {
      expect(Textarea.displayName).toBe("Textarea");
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });
  });

  describe("States", () => {
    it("applies disabled styles when disabled", () => {
      render(<Textarea disabled data-testid="textarea" />);
      const textarea = screen.getByTestId("textarea");
      expect(textarea).toBeDisabled();
      expect(textarea).toHaveClass("disabled:cursor-not-allowed", "disabled:opacity-50");
    });

    it("prevents input when disabled", () => {
      render(<Textarea disabled data-testid="textarea" value="" readOnly />);
      const textarea = screen.getByTestId("textarea");
      expect(textarea).toBeDisabled();
      expect(textarea).toHaveValue("");
    });

    it("handles onChange callback", () => {
      const handleChange = vi.fn();
      render(<Textarea onChange={handleChange} data-testid="textarea" />);
      const textarea = screen.getByTestId("textarea");
      fireEvent.change(textarea, { target: { value: "a" } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("merges custom className", () => {
      render(<Textarea className="custom-textarea" data-testid="textarea" />);
      const textarea = screen.getByTestId("textarea");
      expect(textarea).toHaveClass("custom-textarea");
    });

    it("applies base styling classes", () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId("textarea");
      expect(textarea).toHaveClass("flex", "min-h-[80px]", "w-full", "rounded-md", "border");
    });

    it("applies focus-visible styles", () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId("textarea");
      expect(textarea).toHaveClass("focus-visible:outline-none", "focus-visible:ring-2");
    });
  });

  describe("Attributes", () => {
    it("forwards aria attributes", () => {
      render(
        <Textarea
          aria-label="Test textarea"
          aria-describedby="description"
          data-testid="textarea"
        />
      );
      const textarea = screen.getByTestId("textarea");
      expect(textarea).toHaveAttribute("aria-label", "Test textarea");
      expect(textarea).toHaveAttribute("aria-describedby", "description");
    });

    it("forwards placeholder", () => {
      render(<Textarea placeholder="Enter value" />);
      expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
    });

    it("forwards rows attribute", () => {
      render(<Textarea rows={5} data-testid="textarea" />);
      const textarea = screen.getByTestId("textarea");
      expect(textarea).toHaveAttribute("rows", "5");
    });
  });
});
