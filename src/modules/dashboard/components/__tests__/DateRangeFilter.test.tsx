/**
 * DateRangeFilter Container Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateRangeFilter } from "../DateRangeFilter/DateRangeFilter";
import type { DateRangeState, DateRangeActions } from "../../hooks/useDateRangeState";

// Mock child components to isolate container logic
vi.mock("../DateRangeFilter/DateRangeDropdown", () => ({
  DateRangeDropdown: vi.fn(({ displayLabel, selectedPreset }) => (
    <div data-testid="dropdown">
      <span data-testid="display-label">{displayLabel}</span>
      <span data-testid="selected-preset">{selectedPreset}</span>
    </div>
  )),
}));

vi.mock("../DateRangeFilter/DateRangeCalendar", () => ({
  DateRangeCalendar: vi.fn(({ isOpen }) => (
    <div data-testid="calendar" data-open={isOpen}>Calendar Mock</div>
  )),
}));

vi.mock("../../config", () => ({
  getPresetLabel: vi.fn((preset: string) => {
    const labels: Record<string, string> = {
      today: "Hoje",
      yesterday: "Ontem",
      "7days": "Últimos 7 dias",
      "30days": "Últimos 30 dias",
      max: "Período Máximo",
      custom: "Personalizado",
    };
    return labels[preset] || preset;
  }),
}));

describe("DateRangeFilter", () => {
  const createMockState = (overrides: Partial<DateRangeState> = {}): DateRangeState => ({
    preset: "7days",
    dropdownOpen: false,
    calendarOpen: false,
    leftDate: undefined,
    rightDate: undefined,
    leftMonth: new Date(2024, 0, 1),
    rightMonth: new Date(2024, 1, 1),
    hasError: false,
    savedRange: undefined,
    ...overrides,
  });

  const createMockActions = (): DateRangeActions => ({
    openDropdown: vi.fn(),
    closeDropdown: vi.fn(),
    openCalendar: vi.fn(),
    closeCalendar: vi.fn(),
    setPreset: vi.fn(),
    setLeftDate: vi.fn(),
    setRightDate: vi.fn(),
    setLeftMonth: vi.fn(),
    setRightMonth: vi.fn(),
    applyCustomRange: vi.fn(),
    cancel: vi.fn(),
    restoreSaved: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Display Label Calculation", () => {
    it("should show preset label for non-custom presets", () => {
      const state = createMockState({ preset: "7days" });
      const actions = createMockActions();

      render(<DateRangeFilter state={state} actions={actions} />);

      expect(screen.getByTestId("display-label")).toHaveTextContent("Últimos 7 dias");
    });

    it("should show preset label for 'today'", () => {
      const state = createMockState({ preset: "today" });
      const actions = createMockActions();

      render(<DateRangeFilter state={state} actions={actions} />);

      expect(screen.getByTestId("display-label")).toHaveTextContent("Hoje");
    });

    it("should show date range for custom preset with savedRange", () => {
      const state = createMockState({
        preset: "custom",
        savedRange: {
          from: new Date(2024, 0, 15),
          to: new Date(2024, 0, 20),
        },
      });
      const actions = createMockActions();

      render(<DateRangeFilter state={state} actions={actions} />);

      // Should format as "15/01 - 20/01"
      expect(screen.getByTestId("display-label")).toHaveTextContent("15/01 - 20/01");
    });

    it("should show 'Personalizado' for custom preset without savedRange", () => {
      const state = createMockState({
        preset: "custom",
        savedRange: undefined,
      });
      const actions = createMockActions();

      render(<DateRangeFilter state={state} actions={actions} />);

      expect(screen.getByTestId("display-label")).toHaveTextContent("Personalizado");
    });
  });

  describe("Component Composition", () => {
    it("should render DateRangeDropdown", () => {
      const state = createMockState();
      const actions = createMockActions();

      render(<DateRangeFilter state={state} actions={actions} />);

      expect(screen.getByTestId("dropdown")).toBeInTheDocument();
    });

    it("should render DateRangeCalendar", () => {
      const state = createMockState();
      const actions = createMockActions();

      render(<DateRangeFilter state={state} actions={actions} />);

      expect(screen.getByTestId("calendar")).toBeInTheDocument();
    });

    it("should pass selected preset to dropdown", () => {
      const state = createMockState({ preset: "30days" });
      const actions = createMockActions();

      render(<DateRangeFilter state={state} actions={actions} />);

      expect(screen.getByTestId("selected-preset")).toHaveTextContent("30days");
    });

    it("should pass calendarOpen state to calendar", () => {
      const state = createMockState({ calendarOpen: true });
      const actions = createMockActions();

      render(<DateRangeFilter state={state} actions={actions} />);

      expect(screen.getByTestId("calendar")).toHaveAttribute("data-open", "true");
    });
  });

  describe("State Propagation", () => {
    it("should propagate dropdown closed state", () => {
      const state = createMockState({ dropdownOpen: false });
      const actions = createMockActions();

      render(<DateRangeFilter state={state} actions={actions} />);

      // Component should render without errors
      expect(screen.getByTestId("dropdown")).toBeInTheDocument();
    });

    it("should propagate calendar closed state", () => {
      const state = createMockState({ calendarOpen: false });
      const actions = createMockActions();

      render(<DateRangeFilter state={state} actions={actions} />);

      expect(screen.getByTestId("calendar")).toHaveAttribute("data-open", "false");
    });
  });
});
