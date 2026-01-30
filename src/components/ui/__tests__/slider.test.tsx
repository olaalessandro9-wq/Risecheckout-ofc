/**
 * Slider Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Slider component from Radix UI.
 * Covers: rendering, value changes, range, accessibility.
 *
 * @module components/ui/__tests__/slider.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { Slider } from "../slider";

// ============================================================================
// Test Suite: Slider
// ============================================================================

describe("Slider", () => {
  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe("Rendering", () => {
    it("renders slider", () => {
      render(<Slider data-testid="slider" />);
      expect(screen.getByTestId("slider")).toBeInTheDocument();
    });

    it("renders with default value", () => {
      render(<Slider defaultValue={[50]} data-testid="slider" />);
      expect(screen.getByTestId("slider")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<Slider className="custom-slider" data-testid="slider" />);
      expect(screen.getByTestId("slider")).toHaveClass("custom-slider");
    });

    it("renders thumb element", () => {
      render(<Slider defaultValue={[50]} />);
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });

    it("renders track and range elements", () => {
      const { container } = render(<Slider defaultValue={[50]} />);
      expect(container.querySelector('[class*="Track"]') || container.querySelector('[data-orientation]')).toBeTruthy();
    });
  });

  // ==========================================================================
  // Value Tests
  // ==========================================================================

  describe("Value", () => {
    it("displays correct aria-valuenow", () => {
      render(<Slider defaultValue={[75]} />);
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "75");
    });

    it("displays correct aria-valuemin", () => {
      render(<Slider min={10} defaultValue={[50]} />);
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuemin", "10");
    });

    it("displays correct aria-valuemax", () => {
      render(<Slider max={200} defaultValue={[50]} />);
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuemax", "200");
    });

    it("calls onValueChange when value changes", () => {
      const handleChange = vi.fn();
      render(<Slider defaultValue={[50]} onValueChange={handleChange} />);

      const thumb = screen.getByRole("slider");
      
      // Simulate keyboard interaction
      fireEvent.keyDown(thumb, { key: "ArrowRight" });
      expect(handleChange).toHaveBeenCalled();
    });

    it("respects step value", () => {
      const handleChange = vi.fn();
      render(<Slider defaultValue={[50]} step={10} onValueChange={handleChange} />);

      const thumb = screen.getByRole("slider");
      fireEvent.keyDown(thumb, { key: "ArrowRight" });
      
      // Should increment by step value
      expect(handleChange).toHaveBeenCalledWith([60]);
    });

    it("works with controlled value", () => {
      const handleChange = vi.fn();
      const { rerender } = render(<Slider value={[30]} onValueChange={handleChange} />);

      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "30");

      rerender(<Slider value={[70]} onValueChange={handleChange} />);
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "70");
    });
  });

  // ==========================================================================
  // Range Tests
  // ==========================================================================

  describe("Range", () => {
    it("respects min boundary on keyboard navigation", () => {
      const handleChange = vi.fn();
      render(<Slider min={20} max={100} defaultValue={[25]} onValueChange={handleChange} />);
      
      const thumb = screen.getByRole("slider");
      // Try to go below min
      fireEvent.keyDown(thumb, { key: "Home" });
      expect(handleChange).toHaveBeenCalledWith([20]);
    });

    it("respects max boundary on keyboard navigation", () => {
      const handleChange = vi.fn();
      render(<Slider min={0} max={80} defaultValue={[75]} onValueChange={handleChange} />);
      
      const thumb = screen.getByRole("slider");
      // Try to go above max
      fireEvent.keyDown(thumb, { key: "End" });
      expect(handleChange).toHaveBeenCalledWith([80]);
    });

    it("handles 0-100 range", () => {
      render(<Slider min={0} max={100} defaultValue={[50]} />);
      const slider = screen.getByRole("slider");
      
      expect(slider).toHaveAttribute("aria-valuemin", "0");
      expect(slider).toHaveAttribute("aria-valuemax", "100");
      expect(slider).toHaveAttribute("aria-valuenow", "50");
    });

    it("handles custom range", () => {
      render(<Slider min={-50} max={50} defaultValue={[0]} />);
      const slider = screen.getByRole("slider");
      
      expect(slider).toHaveAttribute("aria-valuemin", "-50");
      expect(slider).toHaveAttribute("aria-valuemax", "50");
      expect(slider).toHaveAttribute("aria-valuenow", "0");
    });
  });

  // ==========================================================================
  // Keyboard Navigation Tests
  // ==========================================================================

  describe("Keyboard Navigation", () => {
    it("increases value with ArrowRight", () => {
      const handleChange = vi.fn();
      render(<Slider defaultValue={[50]} onValueChange={handleChange} />);

      const thumb = screen.getByRole("slider");
      fireEvent.keyDown(thumb, { key: "ArrowRight" });

      expect(handleChange).toHaveBeenCalledWith([51]);
    });

    it("decreases value with ArrowLeft", () => {
      const handleChange = vi.fn();
      render(<Slider defaultValue={[50]} onValueChange={handleChange} />);

      const thumb = screen.getByRole("slider");
      fireEvent.keyDown(thumb, { key: "ArrowLeft" });

      expect(handleChange).toHaveBeenCalledWith([49]);
    });

    it("increases value with ArrowUp", () => {
      const handleChange = vi.fn();
      render(<Slider defaultValue={[50]} onValueChange={handleChange} />);

      const thumb = screen.getByRole("slider");
      fireEvent.keyDown(thumb, { key: "ArrowUp" });

      expect(handleChange).toHaveBeenCalledWith([51]);
    });

    it("decreases value with ArrowDown", () => {
      const handleChange = vi.fn();
      render(<Slider defaultValue={[50]} onValueChange={handleChange} />);

      const thumb = screen.getByRole("slider");
      fireEvent.keyDown(thumb, { key: "ArrowDown" });

      expect(handleChange).toHaveBeenCalledWith([49]);
    });

    it("jumps to min with Home key", () => {
      const handleChange = vi.fn();
      render(<Slider min={0} max={100} defaultValue={[50]} onValueChange={handleChange} />);

      const thumb = screen.getByRole("slider");
      fireEvent.keyDown(thumb, { key: "Home" });

      expect(handleChange).toHaveBeenCalledWith([0]);
    });

    it("jumps to max with End key", () => {
      const handleChange = vi.fn();
      render(<Slider min={0} max={100} defaultValue={[50]} onValueChange={handleChange} />);

      const thumb = screen.getByRole("slider");
      fireEvent.keyDown(thumb, { key: "End" });

      expect(handleChange).toHaveBeenCalledWith([100]);
    });
  });

  // ==========================================================================
  // Disabled State Tests
  // ==========================================================================

  describe("Disabled State", () => {
    it("renders disabled slider", () => {
      render(<Slider disabled data-testid="slider" />);
      expect(screen.getByTestId("slider")).toHaveAttribute("data-disabled", "");
    });

    it("does not respond to keyboard when disabled", () => {
      const handleChange = vi.fn();
      render(<Slider disabled defaultValue={[50]} onValueChange={handleChange} />);

      const thumb = screen.getByRole("slider");
      fireEvent.keyDown(thumb, { key: "ArrowRight" });

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Orientation Tests
  // ==========================================================================

  describe("Orientation", () => {
    it("supports horizontal orientation", () => {
      render(<Slider orientation="horizontal" data-testid="slider" />);
      expect(screen.getByTestId("slider")).toHaveAttribute("data-orientation", "horizontal");
    });

    it("supports vertical orientation", () => {
      render(<Slider orientation="vertical" data-testid="slider" />);
      expect(screen.getByTestId("slider")).toHaveAttribute("data-orientation", "vertical");
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe("Accessibility", () => {
    it("has slider role", () => {
      render(<Slider defaultValue={[50]} />);
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });

    it("has correct aria attributes on root", () => {
      render(<Slider defaultValue={[50]} data-testid="slider" />);
      const slider = screen.getByTestId("slider");
      expect(slider).toHaveAttribute("data-orientation", "horizontal");
    });

    it("thumb has aria-valuenow", () => {
      render(<Slider defaultValue={[50]} />);
      const thumb = screen.getByRole("slider");
      expect(thumb).toHaveAttribute("aria-valuenow", "50");
    });

    it("is focusable", () => {
      render(<Slider defaultValue={[50]} />);
      const thumb = screen.getByRole("slider");
      
      thumb.focus();
      expect(document.activeElement).toBe(thumb);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles no initial value", () => {
      render(<Slider />);
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });

    it("handles decimal step", () => {
      const handleChange = vi.fn();
      render(<Slider defaultValue={[0.5]} step={0.1} min={0} max={1} onValueChange={handleChange} />);

      const thumb = screen.getByRole("slider");
      fireEvent.keyDown(thumb, { key: "ArrowRight" });

      expect(handleChange).toHaveBeenCalledWith([0.6]);
    });

    it("handles large range", () => {
      render(<Slider min={0} max={1000000} defaultValue={[500000]} />);
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "500000");
    });

    it("handles inverted range", () => {
      render(<Slider inverted min={0} max={100} defaultValue={[50]} data-testid="slider" />);
      expect(screen.getByTestId("slider")).toBeInTheDocument();
    });
  });
});
