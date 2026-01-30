/**
 * OverviewPanel Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverviewPanel } from "../OverviewPanel/OverviewPanel";
import type { DashboardMetrics } from "../../types";

// Mock UltrawidePerformanceContext
vi.mock("@/contexts/UltrawidePerformanceContext", () => ({
  useUltrawidePerformance: () => ({
    isUltrawide: false,
    disableBlur: false,
    disableHoverEffects: false,
  }),
}));

// Mock the config
vi.mock("../../config", () => ({
  OVERVIEW_ITEMS_CONFIG: [
    { id: "checkouts", title: "Checkouts", metricKey: "checkoutsStarted", colorScheme: "emerald", delay: 0, icon: () => null },
    { id: "paid", title: "Pagos", metricKey: "totalPaidOrders", colorScheme: "blue", delay: 0.1, icon: () => null },
    { id: "pending", title: "Pendentes", metricKey: "totalPendingOrders", colorScheme: "amber", delay: 0.2, icon: () => null },
    { id: "conversion", title: "Conversão", metricKey: "conversionRate", colorScheme: "purple", delay: 0.3, icon: () => null },
    { id: "ticket", title: "Ticket Médio", metricKey: "averageTicket", colorScheme: "teal", delay: 0.4, icon: () => null },
  ],
  getOverviewColorClasses: () => ({
    iconBg: "bg-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
    glow: "hover:shadow-emerald-500/20",
  }),
}));

describe("OverviewPanel", () => {
  const createMockMetrics = (overrides: Partial<DashboardMetrics> = {}): DashboardMetrics => ({
    totalRevenue: "R$ 10.000,00",
    paidRevenue: "R$ 8.000,00",
    pendingRevenue: "R$ 2.000,00",
    totalFees: "R$ 500,00",
    checkoutsStarted: 150,
    totalPaidOrders: 45,
    totalPendingOrders: 12,
    conversionRate: "30%",
    averageTicket: "R$ 177,78",
    pixRevenue: "R$ 5.000,00",
    creditCardRevenue: "R$ 3.000,00",
    ...overrides,
  });

  describe("Rendering", () => {
    it("should render panel title", () => {
      render(<OverviewPanel metrics={createMockMetrics()} isLoading={false} />);
      
      expect(screen.getByText("Visão Geral")).toBeInTheDocument();
    });

    it("should render all configured metrics", () => {
      render(<OverviewPanel metrics={createMockMetrics()} isLoading={false} />);
      
      expect(screen.getByText("Checkouts")).toBeInTheDocument();
      expect(screen.getByText("Pagos")).toBeInTheDocument();
      expect(screen.getByText("Pendentes")).toBeInTheDocument();
      expect(screen.getByText("Conversão")).toBeInTheDocument();
      expect(screen.getByText("Ticket Médio")).toBeInTheDocument();
    });

    it("should display metric values", () => {
      render(<OverviewPanel metrics={createMockMetrics()} isLoading={false} />);
      
      expect(screen.getByText("150")).toBeInTheDocument(); // checkoutsStarted
      expect(screen.getByText("45")).toBeInTheDocument(); // totalPaidOrders
      expect(screen.getByText("12")).toBeInTheDocument(); // totalPendingOrders
      expect(screen.getByText("30%")).toBeInTheDocument(); // conversionRate
      expect(screen.getByText("R$ 177,78")).toBeInTheDocument(); // averageTicket
    });
  });

  describe("Loading State", () => {
    it("should show loading indicators when loading", () => {
      render(<OverviewPanel metrics={undefined} isLoading={true} />);
      
      const loadingIndicators = screen.getAllByText("...");
      expect(loadingIndicators.length).toBe(5); // 5 metrics
    });

    it("should show metrics when not loading", () => {
      render(<OverviewPanel metrics={createMockMetrics()} isLoading={false} />);
      
      expect(screen.queryByText("...")).not.toBeInTheDocument();
    });
  });

  describe("Empty Metrics", () => {
    it("should show 0 when metrics are undefined", () => {
      render(<OverviewPanel metrics={undefined} isLoading={false} />);
      
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBe(5);
    });
  });

  describe("Layout", () => {
    it("should have proper structure", () => {
      const { container } = render(
        <OverviewPanel metrics={createMockMetrics()} isLoading={false} />
      );
      
      // Panel container
      const panel = container.firstChild;
      expect(panel).toHaveClass("bg-card/95");
      expect(panel).toHaveClass("border");
      expect(panel).toHaveClass("rounded-2xl");
    });
  });
});
