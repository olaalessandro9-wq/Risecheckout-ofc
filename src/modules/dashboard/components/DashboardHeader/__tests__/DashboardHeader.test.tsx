/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * DashboardHeader - Testes Unitários
 * 
 * Testa o componente de cabeçalho do dashboard.
 * Cobre renderização, integração com DateRangeFilter e estilos.
 * 
 * REFATORADO: Usa factories type-safe de src/test/factories/dashboard.ts
 * 
 * @version 2.0.0
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DashboardHeader } from "../DashboardHeader";
import type { DateRangeState, DateRangeActions } from "../../../hooks/useDateRangeState";
import { 
  createMockDateRangeState, 
  createMockDateRangeActions 
} from "@/test/factories/dashboard";

// ============================================
// MOCKS
// ============================================

// Mock do UltrawidePerformanceContext
vi.mock("@/contexts/UltrawidePerformanceContext", () => ({
  useUltrawidePerformance: () => ({
    disableBlur: false,
  }),
}));

// Mock do DateRangeFilter
vi.mock("../../DateRangeFilter", () => ({
  DateRangeFilter: ({ state, actions }: { state: DateRangeState; actions: DateRangeActions }) => (
    <div data-testid="date-range-filter">
      <span>Preset: {state.preset}</span>
      <button onClick={() => actions.setPreset("7days")}>Set Last 7 Days</button>
    </div>
  ),
}));

// ============================================
// MOCK DATA (Type-Safe Factories)
// ============================================

const mockState = createMockDateRangeState({ preset: "30days" });
const mockActions = createMockDateRangeActions();

// ============================================
// TESTS: RENDERING
// ============================================

describe("DashboardHeader - Rendering", () => {
  it("should render main title", () => {
    render(<DashboardHeader state={mockState} actions={mockActions} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("should render subtitle", () => {
    render(<DashboardHeader state={mockState} actions={mockActions} />);

    expect(screen.getByText("Visão geral do seu desempenho e métricas")).toBeInTheDocument();
  });

  it("should render DateRangeFilter component", () => {
    render(<DashboardHeader state={mockState} actions={mockActions} />);

    expect(screen.getByTestId("date-range-filter")).toBeInTheDocument();
  });

  it("should pass state to DateRangeFilter", () => {
    render(<DashboardHeader state={mockState} actions={mockActions} />);

    expect(screen.getByText("Preset: 30days")).toBeInTheDocument();
  });

  it("should pass actions to DateRangeFilter", () => {
    render(<DashboardHeader state={mockState} actions={mockActions} />);

    const button = screen.getByText("Set Last 7 Days");
    expect(button).toBeInTheDocument();
  });
});

// ============================================
// TESTS: LAYOUT
// ============================================

describe("DashboardHeader - Layout", () => {
  it("should use flex layout", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const flexContainer = container.querySelector(".flex");
    expect(flexContainer).toBeInTheDocument();
  });

  it("should have responsive flex direction", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const responsiveFlex = container.querySelector(".flex-col.md\\:flex-row");
    expect(responsiveFlex).toBeInTheDocument();
  });

  it("should have gap between elements", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const gapContainer = container.querySelector('[class*="gap-"]');
    expect(gapContainer).toBeInTheDocument();
  });
});

// ============================================
// TESTS: TITLE STYLING
// ============================================

describe("DashboardHeader - Title Styling", () => {
  it("should apply gradient to title", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const gradientTitle = container.querySelector(".bg-gradient-to-r");
    expect(gradientTitle).toBeInTheDocument();
  });

  it("should apply text-transparent to title", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const transparentText = container.querySelector(".text-transparent");
    expect(transparentText).toBeInTheDocument();
  });

  it("should apply bg-clip-text to title", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const clippedText = container.querySelector(".bg-clip-text");
    expect(clippedText).toBeInTheDocument();
  });

  it("should have responsive font sizes for title", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const responsiveTitle = container.querySelector(".text-2xl.md\\:text-3xl.lg\\:text-4xl");
    expect(responsiveTitle).toBeInTheDocument();
  });
});

// ============================================
// TESTS: SUBTITLE STYLING
// ============================================

describe("DashboardHeader - Subtitle Styling", () => {
  it("should apply muted-foreground color to subtitle", () => {
    render(<DashboardHeader state={mockState} actions={mockActions} />);

    const subtitle = screen.getByText("Visão geral do seu desempenho e métricas");
    expect(subtitle.className).toContain("text-muted-foreground");
  });

  it("should have responsive font sizes for subtitle", () => {
    render(<DashboardHeader state={mockState} actions={mockActions} />);

    const subtitle = screen.getByText("Visão geral do seu desempenho e métricas");
    expect(subtitle.className).toContain("text-sm");
    expect(subtitle.className).toContain("md:text-base");
  });

  it("should apply font-medium to subtitle", () => {
    render(<DashboardHeader state={mockState} actions={mockActions} />);

    const subtitle = screen.getByText("Visão geral do seu desempenho e métricas");
    expect(subtitle.className).toContain("font-medium");
  });
});

// ============================================
// TESTS: FILTER CONTAINER
// ============================================

describe("DashboardHeader - Filter Container", () => {
  it("should apply card background to filter container", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const filterContainer = container.querySelector('[class*="bg-card"]');
    expect(filterContainer).toBeInTheDocument();
  });

  it("should apply border to filter container", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const filterContainer = container.querySelector('[class*="border-border"]');
    expect(filterContainer).toBeInTheDocument();
  });

  it("should apply rounded corners to filter container", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const filterContainer = container.querySelector(".rounded-xl");
    expect(filterContainer).toBeInTheDocument();
  });

  it("should have responsive width for filter container", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const filterContainer = container.querySelector(".w-full.md\\:w-auto");
    expect(filterContainer).toBeInTheDocument();
  });
});

// ============================================
// TESTS: STATE VARIATIONS (Type-Safe)
// ============================================

describe("DashboardHeader - State Variations", () => {
  it("should handle custom date range state", () => {
    const customState = createMockDateRangeState({
      preset: "custom",
      savedRange: {
        from: new Date("2024-01-01"),
        to: new Date("2024-01-31"),
      },
      calendarOpen: false,
    });

    render(<DashboardHeader state={customState} actions={mockActions} />);

    expect(screen.getByText("Preset: custom")).toBeInTheDocument();
  });

  it("should handle 7days preset", () => {
    const last7State = createMockDateRangeState({ preset: "7days" });

    render(<DashboardHeader state={last7State} actions={mockActions} />);

    expect(screen.getByText("Preset: 7days")).toBeInTheDocument();
  });

  it("should handle today preset", () => {
    const todayState = createMockDateRangeState({ preset: "today" });

    render(<DashboardHeader state={todayState} actions={mockActions} />);

    expect(screen.getByText("Preset: today")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: ACTIONS INTEGRATION
// ============================================

describe("DashboardHeader - Actions Integration", () => {
  it("should provide all actions to DateRangeFilter", () => {
    const actions = createMockDateRangeActions();

    render(<DashboardHeader state={mockState} actions={actions} />);

    expect(screen.getByTestId("date-range-filter")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("DashboardHeader - Edge Cases", () => {
  it("should handle undefined savedRange", () => {
    const stateWithNoRange = createMockDateRangeState({
      preset: "30days",
      savedRange: undefined,
    });

    render(<DashboardHeader state={stateWithNoRange} actions={mockActions} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("should render consistently with different presets", () => {
    const presets = ["today", "yesterday", "7days", "30days", "max", "custom"] as const;

    presets.forEach((preset) => {
      const state = createMockDateRangeState({
        preset,
        calendarOpen: preset === "custom",
      });

      const { unmount } = render(<DashboardHeader state={state} actions={mockActions} />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      unmount();
    });
  });
});
