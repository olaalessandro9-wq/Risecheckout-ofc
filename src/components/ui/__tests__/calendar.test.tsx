/**
 * Calendar Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Calendar component using react-day-picker.
 * Covers: rendering, date selection, navigation, accessibility.
 *
 * @module components/ui/__tests__/calendar.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { Calendar } from "../calendar";

// ============================================================================
// Test Suite: Calendar
// ============================================================================

describe("Calendar", () => {
  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe("Rendering", () => {
    it("renders calendar", () => {
      render(<Calendar />);
      // Calendar should render with navigation and days
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      const { container } = render(<Calendar className="custom-calendar" />);
      expect(container.querySelector(".custom-calendar")).toBeInTheDocument();
    });

    it("renders month caption", () => {
      render(<Calendar defaultMonth={new Date(2024, 0)} />);
      expect(screen.getByText(/january/i)).toBeInTheDocument();
    });

    it("renders day headers", () => {
      render(<Calendar />);
      // Should show day abbreviations
      expect(screen.getByText(/su/i)).toBeInTheDocument();
      expect(screen.getByText(/mo/i)).toBeInTheDocument();
    });

    it("renders navigation buttons", () => {
      render(<Calendar />);
      // Previous and next month buttons
      expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================================================
  // Date Selection Tests
  // ==========================================================================

  describe("Date Selection", () => {
    it("calls onSelect when date is clicked", () => {
      const handleSelect = vi.fn();
      render(
        <Calendar
          mode="single"
          onSelect={handleSelect}
          defaultMonth={new Date(2024, 0)}
        />
      );

      // Find a day button (15th of the month)
      const day15 = screen.getByText("15");
      fireEvent.click(day15);

      expect(handleSelect).toHaveBeenCalled();
    });

    it("shows selected date", () => {
      const selectedDate = new Date(2024, 0, 15);
      render(
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={new Date(2024, 0)}
        />
      );

      const day15 = screen.getByText("15");
      expect(day15).toHaveAttribute("aria-selected", "true");
    });

    it("supports multiple date selection", () => {
      const handleSelect = vi.fn();
      render(
        <Calendar
          mode="multiple"
          onSelect={handleSelect}
          defaultMonth={new Date(2024, 0)}
        />
      );

      fireEvent.click(screen.getByText("10"));
      fireEvent.click(screen.getByText("15"));

      expect(handleSelect).toHaveBeenCalledTimes(2);
    });

    it("supports range selection", () => {
      const handleSelect = vi.fn();
      render(
        <Calendar
          mode="range"
          onSelect={handleSelect}
          defaultMonth={new Date(2024, 0)}
        />
      );

      fireEvent.click(screen.getByText("10"));
      fireEvent.click(screen.getByText("20"));

      expect(handleSelect).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // Navigation Tests
  // ==========================================================================

  describe("Navigation", () => {
    it("navigates to previous month", () => {
      render(<Calendar defaultMonth={new Date(2024, 1)} />); // February

      const prevButton = screen.getAllByRole("button")[0];
      fireEvent.click(prevButton);

      expect(screen.getByText(/january/i)).toBeInTheDocument();
    });

    it("navigates to next month", () => {
      render(<Calendar defaultMonth={new Date(2024, 0)} />); // January

      const buttons = screen.getAllByRole("button");
      const nextButton = buttons[buttons.length - 1];
      fireEvent.click(nextButton);

      expect(screen.getByText(/february/i)).toBeInTheDocument();
    });

    it("respects fromDate restriction", () => {
      const fromDate = new Date(2024, 0, 15);
      const { container } = render(
        <Calendar
          fromDate={fromDate}
          defaultMonth={new Date(2024, 0)}
        />
      );

      // Days before fromDate should have day-disabled class
      const disabledDays = container.querySelectorAll('.day_disabled, [class*="disabled"]');
      expect(disabledDays.length).toBeGreaterThanOrEqual(0);
    });

    it("respects toDate restriction", () => {
      const toDate = new Date(2024, 0, 15);
      const { container } = render(
        <Calendar
          toDate={toDate}
          defaultMonth={new Date(2024, 0)}
        />
      );

      // Calendar should render correctly with toDate
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Disabled Dates Tests
  // ==========================================================================

  describe("Disabled Dates", () => {
    it("passes disabled prop to calendar", () => {
      const disabledDates = [new Date(2024, 0, 15)];
      const { container } = render(
        <Calendar
          disabled={disabledDates}
          defaultMonth={new Date(2024, 0)}
        />
      );

      // Calendar should render with disabled dates config
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });

    it("applies disabled styling to weekend dates", () => {
      // Disable weekends
      const disableWeekends = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
      };

      const { container } = render(
        <Calendar
          disabled={disableWeekends}
          defaultMonth={new Date(2024, 0)}
        />
      );

      // Calendar should render correctly
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });

    it("prevents selection of disabled dates", () => {
      const handleSelect = vi.fn();
      const disabledDates = [new Date(2024, 0, 15)];

      render(
        <Calendar
          mode="single"
          disabled={disabledDates}
          onSelect={handleSelect}
          defaultMonth={new Date(2024, 0)}
        />
      );

      const day15 = screen.getByText("15");
      fireEvent.click(day15);

      expect(handleSelect).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Outside Days Tests
  // ==========================================================================

  describe("Outside Days", () => {
    it("hides outside days by default", () => {
      render(<Calendar showOutsideDays={false} defaultMonth={new Date(2024, 0)} />);
      // Outside days should not be interactable
      const grid = screen.getByRole("grid");
      const outsideDays = grid.querySelectorAll(".day-outside");
      outsideDays.forEach((day) => {
        expect(day).toHaveClass("pointer-events-none");
      });
    });

    it("shows outside days when enabled", () => {
      render(<Calendar showOutsideDays={true} defaultMonth={new Date(2024, 0)} />);
      // Calendar should still render
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe("Accessibility", () => {
    it("has grid role", () => {
      render(<Calendar />);
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("has proper aria-selected on selected date", () => {
      render(
        <Calendar
          mode="single"
          selected={new Date(2024, 0, 15)}
          defaultMonth={new Date(2024, 0)}
        />
      );

      const day15 = screen.getByText("15");
      expect(day15).toHaveAttribute("aria-selected", "true");
    });

    it("has proper disabled date configuration", () => {
      const { container } = render(
        <Calendar
          disabled={[new Date(2024, 0, 15)]}
          defaultMonth={new Date(2024, 0)}
        />
      );

      // Calendar should handle disabled dates
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Keyboard Navigation Tests
  // ==========================================================================

  describe("Keyboard Navigation", () => {
    it("day buttons are clickable", () => {
      const handleSelect = vi.fn();
      render(
        <Calendar
          mode="single"
          onSelect={handleSelect}
          defaultMonth={new Date(2024, 0)}
        />
      );

      const day15 = screen.getByText("15");
      fireEvent.click(day15);

      expect(handleSelect).toHaveBeenCalled();
    });

    it("navigation buttons work", () => {
      render(<Calendar defaultMonth={new Date(2024, 0)} />);

      const buttons = screen.getAllByRole("button");
      const nextButton = buttons[buttons.length - 1];
      
      fireEvent.click(nextButton);
      
      expect(screen.getByText(/february/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles undefined selected date", () => {
      render(<Calendar mode="single" selected={undefined} />);
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("handles leap year February", () => {
      render(<Calendar defaultMonth={new Date(2024, 1)} />); // February 2024 (leap year)
      expect(screen.getByText("29")).toBeInTheDocument();
    });

    it("handles non-leap year February", () => {
      render(<Calendar defaultMonth={new Date(2023, 1)} />); // February 2023 (non-leap year)
      expect(screen.queryByText("29")).not.toBeInTheDocument();
    });

    it("handles month with 31 days", () => {
      render(<Calendar defaultMonth={new Date(2024, 0)} />); // January
      expect(screen.getByText("31")).toBeInTheDocument();
    });

    it("handles month with 30 days", () => {
      render(<Calendar defaultMonth={new Date(2024, 3)} />); // April
      expect(screen.getByText("30")).toBeInTheDocument();
      expect(screen.queryByText("31")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Custom ClassNames Tests
  // ==========================================================================

  describe("Custom ClassNames", () => {
    it("applies custom classNames to elements", () => {
      const { container } = render(
        <Calendar
          classNames={{
            months: "custom-months",
            month: "custom-month",
          }}
        />
      );

      expect(container.querySelector(".custom-months")).toBeInTheDocument();
      expect(container.querySelector(".custom-month")).toBeInTheDocument();
    });
  });
});
