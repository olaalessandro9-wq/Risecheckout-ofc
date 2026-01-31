/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * MetricsGrid - Testes Unitários
 * 
 * Testa o componente de grid de métricas do dashboard.
 * Cobre renderização, loading, métricas e integração com configuração.
 * 
 * REFATORADO: Usa factories type-safe de src/test/factories/dashboard.ts
 * - Substitui 'percentage' por 'label' (SSOT TrendData)
 * - Inclui todos os campos obrigatórios de DashboardMetrics
 * 
 * @version 2.0.0
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MetricsGrid } from "../MetricsGrid";
import type { TrendData } from "../../../types";
import { 
  createMockDashboardMetrics, 
  createMockTrendData 
} from "@/test/factories/dashboard";

// ============================================
// MOCKS
// ============================================

// Mock do MetricCard
vi.mock("../MetricCard", () => ({
  MetricCard: ({ title, value, isLoading, trend }: {
    title: string;
    value: string | number;
    isLoading: boolean;
    trend?: TrendData;
  }) => (
    <div data-testid={`metric-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <span data-testid="metric-title">{title}</span>
      <span data-testid="metric-value">{isLoading ? "Loading..." : value}</span>
      {trend && <span data-testid="metric-trend">{trend.label}</span>}
    </div>
  ),
}));

// Mock da configuração de métricas
vi.mock("../../../config", () => ({
  DASHBOARD_METRICS_CONFIG: [
    {
      id: "revenue",
      title: "Faturamento",
      metricKey: "totalRevenue",
      trendKey: "revenueTrend",
      icon: () => <div>Icon</div>,
      colorScheme: "emerald",
      delay: 0.1,
    },
    {
      id: "paid",
      title: "Vendas aprovadas",
      metricKey: "paidRevenue",
      trendKey: "paidRevenueTrend",
      icon: () => <div>Icon</div>,
      colorScheme: "blue",
      delay: 0.2,
    },
    {
      id: "pending",
      title: "Vendas pendentes",
      metricKey: "pendingRevenue",
      trendKey: "pendingRevenueTrend",
      icon: () => <div>Icon</div>,
      colorScheme: "amber",
      delay: 0.3,
    },
    {
      id: "conversion",
      title: "Taxa de Conversão",
      metricKey: "conversionRate",
      trendKey: "conversionTrend",
      icon: () => <div>Icon</div>,
      colorScheme: "purple",
      delay: 0.4,
    },
  ],
  getMetricColorClasses: () => ({
    gradient: "from-emerald-500/10 to-emerald-500/5",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-500",
    hoverBorder: "hover:border-emerald-500/20",
  }),
}));

// ============================================
// MOCK DATA (Type-Safe Factories)
// ============================================

const mockMetrics = createMockDashboardMetrics({
  totalRevenue: "R$ 50.000,00",
  paidRevenue: "R$ 45.000,00",
  pendingRevenue: "R$ 5.000,00",
  conversionRate: "85%",
  revenueTrend: createMockTrendData({
    value: 15.5,
    label: "+15.5%",
    isPositive: true,
  }),
  paidRevenueTrend: createMockTrendData({
    value: 12.3,
    label: "+12.3%",
    isPositive: true,
  }),
  pendingRevenueTrend: createMockTrendData({
    value: -5.2,
    label: "-5.2%",
    isPositive: false,
  }),
  conversionTrend: createMockTrendData({
    value: 3.1,
    label: "+3.1%",
    isPositive: true,
  }),
});

const mockEmptyMetrics = createMockDashboardMetrics({
  totalRevenue: "R$ 0,00",
  paidRevenue: "R$ 0,00",
  pendingRevenue: "R$ 0,00",
  conversionRate: "0%",
});

// ============================================
// TESTS: RENDERING
// ============================================

describe("MetricsGrid - Rendering", () => {
  it("should render all 4 metric cards", () => {
    render(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    expect(screen.getByTestId("metric-card-faturamento")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-vendas-aprovadas")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-vendas-pendentes")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-taxa-de-conversão")).toBeInTheDocument();
  });

  it("should render metric titles", () => {
    render(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    const titles = screen.getAllByTestId("metric-title");
    expect(titles).toHaveLength(4);
    expect(titles[0]).toHaveTextContent("Faturamento");
    expect(titles[1]).toHaveTextContent("Vendas aprovadas");
    expect(titles[2]).toHaveTextContent("Vendas pendentes");
    expect(titles[3]).toHaveTextContent("Taxa de Conversão");
  });

  it("should render metric values", () => {
    render(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    expect(screen.getByText("R$ 50.000,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 45.000,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 5.000,00")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("should render trend data when available", () => {
    render(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    const trends = screen.getAllByTestId("metric-trend");
    expect(trends).toHaveLength(4);
    expect(trends[0]).toHaveTextContent("+15.5%");
    expect(trends[1]).toHaveTextContent("+12.3%");
    expect(trends[2]).toHaveTextContent("-5.2%");
    expect(trends[3]).toHaveTextContent("+3.1%");
  });
});

// ============================================
// TESTS: LOADING STATE
// ============================================

describe("MetricsGrid - Loading State", () => {
  it("should show loading state for all cards", () => {
    render(<MetricsGrid metrics={mockMetrics} isLoading={true} />);

    const loadingTexts = screen.getAllByText("Loading...");
    expect(loadingTexts).toHaveLength(4);
  });

  it("should render cards even when loading", () => {
    render(<MetricsGrid metrics={mockMetrics} isLoading={true} />);

    expect(screen.getByTestId("metric-card-faturamento")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-vendas-aprovadas")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-vendas-pendentes")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-taxa-de-conversão")).toBeInTheDocument();
  });

  it("should show titles even when loading", () => {
    render(<MetricsGrid metrics={mockMetrics} isLoading={true} />);

    const titles = screen.getAllByTestId("metric-title");
    expect(titles).toHaveLength(4);
  });
});

// ============================================
// TESTS: UNDEFINED METRICS
// ============================================

describe("MetricsGrid - Undefined Metrics", () => {
  it("should handle undefined metrics with default values", () => {
    render(<MetricsGrid metrics={undefined} isLoading={false} />);

    const values = screen.getAllByTestId("metric-value");
    expect(values[0]).toHaveTextContent("R$ 0,00"); // totalRevenue
    expect(values[1]).toHaveTextContent("R$ 0,00"); // paidRevenue
    expect(values[2]).toHaveTextContent("R$ 0,00"); // pendingRevenue
    expect(values[3]).toHaveTextContent("0"); // conversionRate
  });

  it("should render all cards even with undefined metrics", () => {
    render(<MetricsGrid metrics={undefined} isLoading={false} />);

    expect(screen.getByTestId("metric-card-faturamento")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-vendas-aprovadas")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-vendas-pendentes")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-taxa-de-conversão")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EMPTY METRICS
// ============================================

describe("MetricsGrid - Empty Metrics", () => {
  it("should display zero values", () => {
    render(<MetricsGrid metrics={mockEmptyMetrics} isLoading={false} />);

    const zeroRevenues = screen.getAllByText("R$ 0,00");
    expect(zeroRevenues).toHaveLength(3);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("should not show trends when not available", () => {
    render(<MetricsGrid metrics={mockEmptyMetrics} isLoading={false} />);

    const trends = screen.queryAllByTestId("metric-trend");
    expect(trends).toHaveLength(0);
  });
});

// ============================================
// TESTS: LAYOUT
// ============================================

describe("MetricsGrid - Layout", () => {
  it("should use grid layout", () => {
    const { container } = render(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
  });

  it("should have responsive grid columns", () => {
    const { container } = render(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    const responsiveGrid = container.querySelector(".grid-cols-2.lg\\:grid-cols-4");
    expect(responsiveGrid).toBeInTheDocument();
  });

  it("should have gap between cards", () => {
    const { container } = render(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    const gapGrid = container.querySelector('[class*="gap-"]');
    expect(gapGrid).toBeInTheDocument();
  });
});

// ============================================
// TESTS: METRIC TYPES
// ============================================

describe("MetricsGrid - Metric Types", () => {
  it("should handle revenue metrics with currency format", () => {
    render(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    expect(screen.getByText("R$ 50.000,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 45.000,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 5.000,00")).toBeInTheDocument();
  });

  it("should handle percentage metrics", () => {
    render(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("should handle positive trends", () => {
    render(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    expect(screen.getByText("+15.5%")).toBeInTheDocument();
    expect(screen.getByText("+12.3%")).toBeInTheDocument();
    expect(screen.getByText("+3.1%")).toBeInTheDocument();
  });

  it("should handle negative trends", () => {
    render(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    expect(screen.getByText("-5.2%")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("MetricsGrid - Edge Cases", () => {
  it("should handle very large values", () => {
    const largeMetrics = createMockDashboardMetrics({
      totalRevenue: "R$ 999.999.999,99",
      paidRevenue: "R$ 999.999.999,99",
      pendingRevenue: "R$ 999.999.999,99",
      conversionRate: "100%",
    });

    render(<MetricsGrid metrics={largeMetrics} isLoading={false} />);

    const largeValues = screen.getAllByText("R$ 999.999.999,99");
    expect(largeValues).toHaveLength(3);
  });

  it("should handle partial metrics data", () => {
    const partialMetrics = createMockDashboardMetrics({
      totalRevenue: "R$ 10.000,00",
    });

    render(<MetricsGrid metrics={partialMetrics} isLoading={false} />);

    expect(screen.getByText("R$ 10.000,00")).toBeInTheDocument();
  });

  it("should transition from loading to loaded", () => {
    const { rerender } = render(<MetricsGrid metrics={mockMetrics} isLoading={true} />);

    expect(screen.getAllByText("Loading...")).toHaveLength(4);

    rerender(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.getByText("R$ 50.000,00")).toBeInTheDocument();
  });

  it("should handle metrics update", () => {
    const { rerender } = render(<MetricsGrid metrics={mockMetrics} isLoading={false} />);

    expect(screen.getByText("R$ 50.000,00")).toBeInTheDocument();

    const updatedMetrics = createMockDashboardMetrics({
      ...mockMetrics,
      totalRevenue: "R$ 60.000,00",
    });

    rerender(<MetricsGrid metrics={updatedMetrics} isLoading={false} />);

    expect(screen.getByText("R$ 60.000,00")).toBeInTheDocument();
    expect(screen.queryByText("R$ 50.000,00")).not.toBeInTheDocument();
  });
});
