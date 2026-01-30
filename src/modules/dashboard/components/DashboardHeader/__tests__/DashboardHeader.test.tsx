/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * DashboardHeader - Testes Unitários
 * 
 * Testa o componente de cabeçalho do dashboard.
 * Cobre renderização, integração com DateRangeFilter e estilos.
 * 
 * @version 1.0.0
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DashboardHeader } from "../DashboardHeader";
import type { DateRangeState, DateRangeActions } from "../../../hooks/useDateRangeState";

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
      <span>Preset: {state.selectedPreset}</span>
      <button onClick={() => actions.setPreset("last7Days")}>Set Last 7 Days</button>
    </div>
  ),
}));

// ============================================
// MOCK DATA
// ============================================

const mockState: DateRangeState = {
  selectedPreset: "last30Days",
  customRange: null,
  isCustom: false,
};

const mockActions: DateRangeActions = {
  setPreset: vi.fn(),
  setCustomRange: vi.fn(),
  resetToDefault: vi.fn(),
};

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

    expect(screen.getByText("Preset: last30Days")).toBeInTheDocument();
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
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const subtitle = screen.getByText("Visão geral do seu desempenho e métricas");
    expect(subtitle.className).toContain("text-muted-foreground");
  });

  it("should have responsive font sizes for subtitle", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

    const subtitle = screen.getByText("Visão geral do seu desempenho e métricas");
    expect(subtitle.className).toContain("text-sm");
    expect(subtitle.className).toContain("md:text-base");
  });

  it("should apply font-medium to subtitle", () => {
    const { container } = render(<DashboardHeader state={mockState} actions={mockActions} />);

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
// TESTS: STATE VARIATIONS
// ============================================

describe("DashboardHeader - State Variations", () => {
  it("should handle custom date range state", () => {
    const customState: DateRangeState = {
      selectedPreset: "custom",
      customRange: {
        from: new Date("2024-01-01"),
        to: new Date("2024-01-31"),
      },
      isCustom: true,
    };

    render(<DashboardHeader state={customState} actions={mockActions} />);

    expect(screen.getByText("Preset: custom")).toBeInTheDocument();
  });

  it("should handle last7Days preset", () => {
    const last7State: DateRangeState = {
      selectedPreset: "last7Days",
      customRange: null,
      isCustom: false,
    };

    render(<DashboardHeader state={last7State} actions={mockActions} />);

    expect(screen.getByText("Preset: last7Days")).toBeInTheDocument();
  });

  it("should handle today preset", () => {
    const todayState: DateRangeState = {
      selectedPreset: "today",
      customRange: null,
      isCustom: false,
    };

    render(<DashboardHeader state={todayState} actions={mockActions} />);

    expect(screen.getByText("Preset: today")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: ACTIONS INTEGRATION
// ============================================

describe("DashboardHeader - Actions Integration", () => {
  it("should provide all actions to DateRangeFilter", () => {
    const actions: DateRangeActions = {
      setPreset: vi.fn(),
      setCustomRange: vi.fn(),
      resetToDefault: vi.fn(),
    };

    render(<DashboardHeader state={mockState} actions={actions} />);

    expect(screen.getByTestId("date-range-filter")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("DashboardHeader - Edge Cases", () => {
  it("should handle null customRange", () => {
    const stateWithNull: DateRangeState = {
      selectedPreset: "last30Days",
      customRange: null,
      isCustom: false,
    };

    render(<DashboardHeader state={stateWithNull} actions={mockActions} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("should render consistently with different presets", () => {
    const presets: Array<DateRangeState["selectedPreset"]> = [
      "today",
      "yesterday",
      "last7Days",
      "last30Days",
      "last90Days",
      "custom",
    ];

    presets.forEach((preset) => {
      const state: DateRangeState = {
        selectedPreset: preset,
        customRange: null,
        isCustom: preset === "custom",
      };

      const { unmount } = render(<DashboardHeader state={state} actions={mockActions} />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      unmount();
    });
  });
});
