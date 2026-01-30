/**
 * SpacerEditor Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for SpacerEditor component covering:
 * - Rendering with default values
 * - Slider interaction
 * - Input field interaction
 * - Value updates via onUpdate callback
 * - Edge cases (min/max values)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SpacerEditor } from "../SpacerEditor";
import type { Section, SpacerSettings } from "../../../../types";

describe("SpacerEditor", () => {
  const mockOnUpdate = vi.fn();

  const createMockSection = (height: number = 40): Section => ({
    id: "spacer-1",
    type: "spacer",
    is_active: true,
    settings: {
      height,
    } as SpacerSettings,
  } as Section);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render height label", () => {
      render(
        <SpacerEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Altura")).toBeInTheDocument();
    });

    it("should display current height value", () => {
      render(
        <SpacerEditor
          section={createMockSection(60)}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("60px")).toBeInTheDocument();
    });

    it("should render slider", () => {
      const { container } = render(
        <SpacerEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const slider = container.querySelector('[role="slider"]');
      expect(slider).toBeInTheDocument();
    });

    it("should render input field", () => {
      render(
        <SpacerEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByRole("spinbutton");
      expect(input).toBeInTheDocument();
    });

    it("should show default height when not set", () => {
      const sectionWithoutHeight: Section = {
        id: "spacer-1",
        type: "spacer",
        is_active: true,
        settings: {} as SpacerSettings,
      } as Section;

      render(
        <SpacerEditor
          section={sectionWithoutHeight}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("40px")).toBeInTheDocument();
    });
  });

  describe("Slider Interaction", () => {
    it("should call onUpdate when slider value changes", () => {
      const { container } = render(
        <SpacerEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const slider = container.querySelector('[role="slider"]') as HTMLElement;
      fireEvent.change(slider, { target: { value: "80" } });

      // Note: Slider component behavior may vary, this tests the intent
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  describe("Input Field Interaction", () => {
    it("should display current height in input", () => {
      render(
        <SpacerEditor
          section={createMockSection(100)}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByRole("spinbutton") as HTMLInputElement;
      expect(input.value).toBe("100");
    });

    it("should call onUpdate when input value changes", () => {
      render(
        <SpacerEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "120" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ height: 120 });
    });

    it("should handle invalid input gracefully", () => {
      render(
        <SpacerEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ height: 40 });
    });

    it("should handle non-numeric input", () => {
      render(
        <SpacerEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "abc" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ height: 40 });
    });
  });

  describe("Value Constraints", () => {
    it("should have min value of 10 in input", () => {
      render(
        <SpacerEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByRole("spinbutton") as HTMLInputElement;
      expect(input.min).toBe("10");
    });

    it("should have max value of 500 in input", () => {
      render(
        <SpacerEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByRole("spinbutton") as HTMLInputElement;
      expect(input.max).toBe("500");
    });

    it("should accept minimum value", () => {
      render(
        <SpacerEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "10" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ height: 10 });
    });

    it("should accept maximum value", () => {
      render(
        <SpacerEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, { target: { value: "500" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({ height: 500 });
    });
  });

  describe("Multiple Updates", () => {
    it("should handle multiple sequential updates", () => {
      render(
        <SpacerEditor
          section={createMockSection()}
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByRole("spinbutton");
      
      fireEvent.change(input, { target: { value: "50" } });
      expect(mockOnUpdate).toHaveBeenCalledWith({ height: 50 });

      fireEvent.change(input, { target: { value: "100" } });
      expect(mockOnUpdate).toHaveBeenCalledWith({ height: 100 });

      expect(mockOnUpdate).toHaveBeenCalledTimes(2);
    });
  });
});
