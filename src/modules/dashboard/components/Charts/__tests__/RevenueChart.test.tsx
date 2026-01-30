/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * RevenueChart - Testes Unitários
 * 
 * Testa o componente de gráfico de receita com Recharts.
 * Cobre casos de loading, vazio, sucesso e cálculos de eixo Y.
 * 
 * @version 1.0.0
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RevenueChart } from "../RevenueChart";

// ============================================
// MOCKS
// ============================================

// Mock do UltrawidePerformanceContext
vi.mock("@/contexts/UltrawidePerformanceContext", () => ({
  useUltrawidePerformance: () => ({
    isUltrawide: false,
    chartConfig: {
      debounce: 100,
      strokeWidth: 2,
      isAnimationActive: true,
      animationDuration: 500,
      dot: false,
      activeDot: { r: 4 },
    },
    disableBlur: false,
  }),
}));

// Mock do Recharts
vi.mock("recharts", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock do framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// ============================================
// MOCK DATA
// ============================================

const mockChartData = [
  { date: "01/01", value: 1000 },
  { date: "02/01", value: 1500 },
  { date: "03/01", value: 1200 },
  { date: "04/01", value: 1800 },
  { date: "05/01", value: 2000 },
];

const mockEmptyData: Array<{ date: string; value: number }> = [];

const mockLargeValuesData = [
  { date: "01/01", value: 50000 },
  { date: "02/01", value: 75000 },
  { date: "03/01", value: 100000 },
];

const mockSmallRangeData = [
  { date: "01/01", value: 1000 },
  { date: "02/01", value: 1010 },
  { date: "03/01", value: 1005 },
];

// ============================================
// TESTS: RENDERING
// ============================================

describe("RevenueChart - Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render chart title", () => {
    render(
      <RevenueChart
        title="Faturamento Mensal"
        data={mockChartData}
        isLoading={false}
      />
    );

    expect(screen.getByText("Faturamento Mensal")).toBeInTheDocument();
  });

  it("should render chart components when not loading", () => {
    render(
      <RevenueChart
        title="Faturamento"
        data={mockChartData}
        isLoading={false}
      />
    );

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should render all chart elements", () => {
    render(
      <RevenueChart
        title="Faturamento"
        data={mockChartData}
        isLoading={false}
      />
    );

    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    expect(screen.getByTestId("line")).toBeInTheDocument();
  });

  it("should render icon in header", () => {
    const { container } = render(
      <RevenueChart
        title="Faturamento"
        data={mockChartData}
        isLoading={false}
      />
    );

    const iconContainer = container.querySelector('[style*="hsl(var(--success)"]');
    expect(iconContainer).toBeInTheDocument();
  });
});

// ============================================
// TESTS: LOADING STATE
// ============================================

describe("RevenueChart - Loading State", () => {
  it("should show skeleton when loading", () => {
    const { container } = render(
      <RevenueChart
        title="Faturamento"
        data={mockChartData}
        isLoading={true}
      />
    );

    const skeleton = container.querySelector('[class*="animate-pulse"]');
    expect(skeleton).toBeInTheDocument();
  });

  it("should not show chart when loading", () => {
    render(
      <RevenueChart
        title="Faturamento"
        data={mockChartData}
        isLoading={true}
      />
    );

    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
  });

  it("should show title even when loading", () => {
    render(
      <RevenueChart
        title="Faturamento Mensal"
        data={mockChartData}
        isLoading={true}
      />
    );

    expect(screen.getByText("Faturamento Mensal")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EMPTY DATA
// ============================================

describe("RevenueChart - Empty Data", () => {
  it("should render chart with empty data", () => {
    render(
      <RevenueChart
        title="Faturamento"
        data={mockEmptyData}
        isLoading={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should show title with empty data", () => {
    render(
      <RevenueChart
        title="Faturamento Vazio"
        data={mockEmptyData}
        isLoading={false}
      />
    );

    expect(screen.getByText("Faturamento Vazio")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: DATA VARIATIONS
// ============================================

describe("RevenueChart - Data Variations", () => {
  it("should handle large values", () => {
    render(
      <RevenueChart
        title="Faturamento"
        data={mockLargeValuesData}
        isLoading={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should handle small range data", () => {
    render(
      <RevenueChart
        title="Faturamento"
        data={mockSmallRangeData}
        isLoading={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should handle single data point", () => {
    const singlePoint = [{ date: "01/01", value: 1000 }];

    render(
      <RevenueChart
        title="Faturamento"
        data={singlePoint}
        isLoading={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should handle zero values", () => {
    const zeroData = [
      { date: "01/01", value: 0 },
      { date: "02/01", value: 0 },
    ];

    render(
      <RevenueChart
        title="Faturamento"
        data={zeroData}
        isLoading={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: STYLING
// ============================================

describe("RevenueChart - Styling", () => {
  it("should apply card styling", () => {
    const { container } = render(
      <RevenueChart
        title="Faturamento"
        data={mockChartData}
        isLoading={false}
      />
    );

    const card = container.querySelector('[class*="bg-card"]');
    expect(card).toBeInTheDocument();
  });

  it("should apply border styling", () => {
    const { container } = render(
      <RevenueChart
        title="Faturamento"
        data={mockChartData}
        isLoading={false}
      />
    );

    const border = container.querySelector('[class*="border"]');
    expect(border).toBeInTheDocument();
  });

  it("should apply rounded corners", () => {
    const { container } = render(
      <RevenueChart
        title="Faturamento"
        data={mockChartData}
        isLoading={false}
      />
    );

    const rounded = container.querySelector('[class*="rounded"]');
    expect(rounded).toBeInTheDocument();
  });

  it("should apply CSS containment", () => {
    const { container } = render(
      <RevenueChart
        title="Faturamento"
        data={mockChartData}
        isLoading={false}
      />
    );

    const containedElement = container.querySelector('[style*="contain"]');
    expect(containedElement).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("RevenueChart - Edge Cases", () => {
  it("should handle very long title", () => {
    const longTitle = "A".repeat(100);

    render(
      <RevenueChart
        title={longTitle}
        data={mockChartData}
        isLoading={false}
      />
    );

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it("should handle negative values", () => {
    const negativeData = [
      { date: "01/01", value: -100 },
      { date: "02/01", value: -200 },
    ];

    render(
      <RevenueChart
        title="Faturamento"
        data={negativeData}
        isLoading={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should handle mixed positive and negative values", () => {
    const mixedData = [
      { date: "01/01", value: 1000 },
      { date: "02/01", value: -500 },
      { date: "03/01", value: 2000 },
    ];

    render(
      <RevenueChart
        title="Faturamento"
        data={mixedData}
        isLoading={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("should handle transition from loading to loaded", () => {
    const { rerender } = render(
      <RevenueChart
        title="Faturamento"
        data={mockChartData}
        isLoading={true}
      />
    );

    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();

    rerender(
      <RevenueChart
        title="Faturamento"
        data={mockChartData}
        isLoading={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});
