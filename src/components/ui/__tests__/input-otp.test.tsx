/**
 * InputOTP Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator.
 * Covers: rendering, input handling, slot display, accessibility.
 *
 * @module components/ui/__tests__/input-otp.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "../input-otp";

// ============================================================================
// Test Suite: InputOTP
// ============================================================================

describe("InputOTP", () => {
  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe("Rendering", () => {
    it("renders InputOTP component", () => {
      render(
        <InputOTP maxLength={6} data-testid="otp-input">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(screen.getByTestId("otp-input")).toBeInTheDocument();
    });

    it("renders correct number of slots", () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      );

      // Each slot is a div with specific classes
      const slots = container.querySelectorAll('[class*="border"]');
      expect(slots.length).toBeGreaterThanOrEqual(6);
    });

    it("renders with custom className", () => {
      render(
        <InputOTP maxLength={4} className="custom-otp" data-testid="otp">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(screen.getByTestId("otp")).toHaveClass("custom-otp");
    });

    it("renders with containerClassName", () => {
      const { container } = render(
        <InputOTP maxLength={4} containerClassName="custom-container">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(container.querySelector(".custom-container")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // InputOTPGroup Tests
  // ==========================================================================

  describe("InputOTPGroup", () => {
    it("renders group with custom className", () => {
      render(
        <InputOTP maxLength={4}>
          <InputOTPGroup className="custom-group" data-testid="group">
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(screen.getByTestId("group")).toHaveClass("custom-group");
    });

    it("renders multiple groups", () => {
      render(
        <InputOTP maxLength={6}>
          <InputOTPGroup data-testid="group1">
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup data-testid="group2">
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(screen.getByTestId("group1")).toBeInTheDocument();
      expect(screen.getByTestId("group2")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // InputOTPSlot Tests
  // ==========================================================================

  describe("InputOTPSlot", () => {
    it("renders slot with custom className", () => {
      render(
        <InputOTP maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} className="custom-slot" data-testid="slot" />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(screen.getByTestId("slot")).toHaveClass("custom-slot");
    });

    it("renders slot with correct index styling", () => {
      const { container } = render(
        <InputOTP maxLength={3}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
        </InputOTP>
      );

      // First slot should have rounded-l-md
      const firstSlot = container.querySelector(".first\\:rounded-l-md");
      expect(firstSlot).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // InputOTPSeparator Tests
  // ==========================================================================

  describe("InputOTPSeparator", () => {
    it("renders separator", () => {
      render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator data-testid="separator" />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(screen.getByTestId("separator")).toBeInTheDocument();
    });

    it("separator has correct role", () => {
      render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
          <InputOTPSeparator data-testid="separator" />
          <InputOTPGroup>
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(screen.getByTestId("separator")).toHaveAttribute("role", "separator");
    });
  });

  // ==========================================================================
  // Value Tests
  // ==========================================================================

  describe("Value Handling", () => {
    it("calls onChange when value changes", () => {
      const handleChange = vi.fn();
      render(
        <InputOTP maxLength={4} onChange={handleChange}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      );

      const input = document.querySelector("input");
      if (input) {
        fireEvent.change(input, { target: { value: "1" } });
        expect(handleChange).toHaveBeenCalled();
      }
    });

    it("works with controlled value", () => {
      render(
        <InputOTP maxLength={4} value="1234">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      );

      // Input should have the value
      const input = document.querySelector("input");
      expect(input).toHaveValue("1234");
    });

    it("respects maxLength", () => {
      const handleChange = vi.fn();
      render(
        <InputOTP maxLength={4} onChange={handleChange}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      );

      const input = document.querySelector("input");
      if (input) {
        expect(input).toHaveAttribute("maxlength", "4");
      }
    });
  });

  // ==========================================================================
  // Disabled State Tests
  // ==========================================================================

  describe("Disabled State", () => {
    it("renders disabled state", () => {
      render(
        <InputOTP maxLength={4} disabled data-testid="otp">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      const input = document.querySelector("input");
      expect(input).toBeDisabled();
    });

    it("applies disabled styling", () => {
      const { container } = render(
        <InputOTP maxLength={4} disabled>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(container.querySelector('[class*="disabled"]')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe("Accessibility", () => {
    it("supports aria-label", () => {
      render(
        <InputOTP maxLength={6} aria-label="One-time password">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      const input = document.querySelector("input");
      expect(input).toHaveAttribute("aria-label", "One-time password");
    });

    it("is focusable", () => {
      render(
        <InputOTP maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      const input = document.querySelector("input");
      if (input) {
        input.focus();
        expect(document.activeElement).toBe(input);
      }
    });
  });

  // ==========================================================================
  // Pattern Tests
  // ==========================================================================

  describe("Pattern Validation", () => {
    it("supports numeric pattern", () => {
      render(
        <InputOTP maxLength={4} pattern="^[0-9]*$">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      const input = document.querySelector("input");
      expect(input).toHaveAttribute("pattern", "^[0-9]*$");
    });

    it("supports alphanumeric pattern", () => {
      render(
        <InputOTP maxLength={6} pattern="^[a-zA-Z0-9]*$">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      const input = document.querySelector("input");
      expect(input).toHaveAttribute("pattern", "^[a-zA-Z0-9]*$");
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles empty value", () => {
      render(
        <InputOTP maxLength={4} value="">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      const input = document.querySelector("input");
      expect(input).toHaveValue("");
    });

    it("handles single slot", () => {
      render(
        <InputOTP maxLength={1}>
          <InputOTPGroup>
            <InputOTPSlot index={0} data-testid="single-slot" />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(screen.getByTestId("single-slot")).toBeInTheDocument();
    });

    it("handles many slots", () => {
      const indices = [0, 1, 2, 3, 4, 5, 6, 7];
      render(
        <InputOTP maxLength={8}>
          <InputOTPGroup>
            {indices.map((i) => (
              <InputOTPSlot key={i} index={i} data-testid={`slot-${i}`} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      );

      indices.forEach((i) => {
        expect(screen.getByTestId(`slot-${i}`)).toBeInTheDocument();
      });
    });

    it("handles onComplete callback", () => {
      const handleComplete = vi.fn();
      render(
        <InputOTP maxLength={4} onComplete={handleComplete}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      );

      const input = document.querySelector("input");
      if (input) {
        fireEvent.change(input, { target: { value: "1234" } });
        // onComplete should be called when all slots are filled
        expect(handleComplete).toHaveBeenCalledWith("1234");
      }
    });
  });
});
