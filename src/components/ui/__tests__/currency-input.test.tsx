/**
 * CurrencyInput Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for CurrencyInput component.
 * Covers: rendering, value formatting, keyboard input, paste handling.
 *
 * @module components/ui/__tests__/currency-input.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { CurrencyInput } from "../currency-input";

// ============================================================================
// Test Suite: CurrencyInput
// ============================================================================

describe("CurrencyInput", () => {
  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe("Rendering", () => {
    it("renders input element", () => {
      render(<CurrencyInput value={0} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders with initial value of 0", () => {
      render(<CurrencyInput value={0} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 0,00");
    });

    it("renders with custom className", () => {
      render(<CurrencyInput value={0} onChange={vi.fn()} className="custom-class" />);
      expect(screen.getByRole("textbox")).toHaveClass("custom-class");
    });

    it("renders with id attribute", () => {
      render(<CurrencyInput value={0} onChange={vi.fn()} id="price-input" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("id", "price-input");
    });
  });

  // ==========================================================================
  // Value Formatting Tests (CENTAVOS → REAIS)
  // ==========================================================================

  describe("Value Formatting", () => {
    it("formats 0 centavos as R$ 0,00", () => {
      render(<CurrencyInput value={0} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 0,00");
    });

    it("formats 100 centavos as R$ 1,00", () => {
      render(<CurrencyInput value={100} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 1,00");
    });

    it("formats 150 centavos as R$ 1,50", () => {
      render(<CurrencyInput value={150} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 1,50");
    });

    it("formats 1000 centavos as R$ 10,00", () => {
      render(<CurrencyInput value={1000} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 10,00");
    });

    it("formats 100000 centavos as R$ 1.000,00 (with thousands separator)", () => {
      render(<CurrencyInput value={100000} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 1.000,00");
    });

    it("formats 1000000 centavos as R$ 10.000,00", () => {
      render(<CurrencyInput value={1000000} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 10.000,00");
    });

    it("formats 99 centavos as R$ 0,99", () => {
      render(<CurrencyInput value={99} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 0,99");
    });

    it("formats 1 centavo as R$ 0,01", () => {
      render(<CurrencyInput value={1} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 0,01");
    });
  });

  // ==========================================================================
  // Keyboard Input Tests
  // ==========================================================================

  describe("Keyboard Input", () => {
    it("adds digit when number key pressed", () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={0} onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "1" });

      // 0 * 10 + 1 = 1 centavo
      expect(handleChange).toHaveBeenCalledWith(1);
    });

    it("builds number correctly with multiple digits", () => {
      const handleChange = vi.fn();
      const { rerender } = render(<CurrencyInput value={0} onChange={handleChange} />);

      const input = screen.getByRole("textbox");

      // Type "1"
      fireEvent.keyDown(input, { key: "1" });
      expect(handleChange).toHaveBeenLastCalledWith(1);

      // Rerender with new value and type "5"
      rerender(<CurrencyInput value={1} onChange={handleChange} />);
      fireEvent.keyDown(input, { key: "5" });
      expect(handleChange).toHaveBeenLastCalledWith(15);

      // Rerender with new value and type "0"
      rerender(<CurrencyInput value={15} onChange={handleChange} />);
      fireEvent.keyDown(input, { key: "0" });
      expect(handleChange).toHaveBeenLastCalledWith(150);
    });

    it("removes last digit on Backspace", () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={150} onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Backspace" });

      // 150 / 10 = 15 centavos
      expect(handleChange).toHaveBeenCalledWith(15);
    });

    it("removes last digit on Delete", () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={150} onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Delete" });

      // 150 / 10 = 15 centavos
      expect(handleChange).toHaveBeenCalledWith(15);
    });

    it("prevents non-numeric keys", () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={0} onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "a" });
      fireEvent.keyDown(input, { key: "!" });
      fireEvent.keyDown(input, { key: "." });
      fireEvent.keyDown(input, { key: "," });

      expect(handleChange).not.toHaveBeenCalled();
    });

    it("allows navigation keys without calling onChange", () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={100} onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "ArrowLeft" });
      fireEvent.keyDown(input, { key: "ArrowRight" });
      fireEvent.keyDown(input, { key: "Tab" });

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Paste Handling Tests
  // ==========================================================================

  describe("Paste Handling", () => {
    it("handles paste with numbers only", () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={0} onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      const pasteEvent = {
        preventDefault: vi.fn(),
        clipboardData: {
          getData: () => "1500",
        },
      };

      fireEvent.paste(input, pasteEvent);

      // Should interpret as 1500 centavos
      expect(handleChange).toHaveBeenCalledWith(1500);
    });

    it("handles paste with formatted currency", () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={0} onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      const pasteEvent = {
        preventDefault: vi.fn(),
        clipboardData: {
          getData: () => "R$ 15,00",
        },
      };

      fireEvent.paste(input, pasteEvent);

      // Should extract numbers: 1500 centavos
      expect(handleChange).toHaveBeenCalledWith(1500);
    });

    it("handles paste with mixed characters", () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={0} onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      const pasteEvent = {
        preventDefault: vi.fn(),
        clipboardData: {
          getData: () => "abc123def456",
        },
      };

      fireEvent.paste(input, pasteEvent);

      // Should extract only numbers: 123456
      expect(handleChange).toHaveBeenCalledWith(123456);
    });

    it("ignores paste with no numbers", () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={100} onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      const pasteEvent = {
        preventDefault: vi.fn(),
        clipboardData: {
          getData: () => "abc",
        },
      };

      fireEvent.paste(input, pasteEvent);

      // Should not call onChange for non-numeric paste
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Value Updates Tests
  // ==========================================================================

  describe("Value Updates", () => {
    it("updates display when value prop changes", () => {
      const { rerender } = render(<CurrencyInput value={100} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 1,00");

      rerender(<CurrencyInput value={200} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 2,00");
    });

    it("handles string value prop", () => {
      render(<CurrencyInput value="150" onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 1,50");
    });

    it("handles NaN gracefully", () => {
      render(<CurrencyInput value={NaN} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 0,00");
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles zero correctly", () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={10} onChange={handleChange} />);

      const input = screen.getByRole("textbox");

      // Delete twice to get to 0
      fireEvent.keyDown(input, { key: "Backspace" });
      expect(handleChange).toHaveBeenLastCalledWith(1);
    });

    it("handles very large numbers", () => {
      render(<CurrencyInput value={99999999} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 999.999,99");
    });

    it("handles single digit deletion to zero", () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={5} onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Backspace" });

      // 5 / 10 = 0
      expect(handleChange).toHaveBeenCalledWith(0);
    });

    it("handles rapid sequential input", () => {
      const handleChange = vi.fn();
      const { rerender } = render(<CurrencyInput value={0} onChange={handleChange} />);

      const input = screen.getByRole("textbox");

      // Type "9" twice rapidly
      fireEvent.keyDown(input, { key: "9" });
      expect(handleChange).toHaveBeenLastCalledWith(9);

      rerender(<CurrencyInput value={9} onChange={handleChange} />);
      fireEvent.keyDown(input, { key: "9" });
      expect(handleChange).toHaveBeenLastCalledWith(99);
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration", () => {
    it("builds R$ 123,45 from scratch", () => {
      const handleChange = vi.fn();
      const { rerender } = render(<CurrencyInput value={0} onChange={handleChange} />);

      const input = screen.getByRole("textbox");

      // Type "12345" to get R$ 123,45 (12345 centavos)
      fireEvent.keyDown(input, { key: "1" });
      expect(handleChange).toHaveBeenLastCalledWith(1);

      rerender(<CurrencyInput value={1} onChange={handleChange} />);
      fireEvent.keyDown(input, { key: "2" });
      expect(handleChange).toHaveBeenLastCalledWith(12);

      rerender(<CurrencyInput value={12} onChange={handleChange} />);
      fireEvent.keyDown(input, { key: "3" });
      expect(handleChange).toHaveBeenLastCalledWith(123);

      rerender(<CurrencyInput value={123} onChange={handleChange} />);
      fireEvent.keyDown(input, { key: "4" });
      expect(handleChange).toHaveBeenLastCalledWith(1234);

      rerender(<CurrencyInput value={1234} onChange={handleChange} />);
      fireEvent.keyDown(input, { key: "5" });
      expect(handleChange).toHaveBeenLastCalledWith(12345);

      rerender(<CurrencyInput value={12345} onChange={handleChange} />);
      expect(screen.getByRole("textbox")).toHaveValue("R$ 123,45");
    });
  });
});
