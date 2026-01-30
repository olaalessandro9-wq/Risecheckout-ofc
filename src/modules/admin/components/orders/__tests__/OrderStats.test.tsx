/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * OrderStats - Testes Unitários
 * 
 * Testa o componente de estatísticas de pedidos.
 * Cobre casos de loading, sucesso e formatação de dados.
 * 
 * @version 1.0.0
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OrderStats, type OrderStatsData } from "../OrderStats";

// ============================================
// MOCK DATA
// ============================================

const mockStats: OrderStatsData = {
  totalOrders: 150,
  totalRevenue: 45000000, // 450.000,00 em centavos
  pendingOrders: 12,
  completedOrders: 138,
};

const emptyStats: OrderStatsData = {
  totalOrders: 0,
  totalRevenue: 0,
  pendingOrders: 0,
  completedOrders: 0,
};

// ============================================
// TESTS: RENDERING
// ============================================

describe("OrderStats - Rendering", () => {
  it("should render all stat cards", () => {
    render(<OrderStats stats={mockStats} isLoading={false} />);

    expect(screen.getByText("Total de Pedidos")).toBeInTheDocument();
    expect(screen.getByText("Receita Total")).toBeInTheDocument();
    expect(screen.getByText("Pedidos Pendentes")).toBeInTheDocument();
    expect(screen.getByText("Pedidos Completos")).toBeInTheDocument();
  });

  it("should display correct total orders", () => {
    render(<OrderStats stats={mockStats} isLoading={false} />);

    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("should format revenue correctly in BRL", () => {
    render(<OrderStats stats={mockStats} isLoading={false} />);

    expect(screen.getByText("R$ 450.000,00")).toBeInTheDocument();
  });

  it("should display correct pending orders", () => {
    render(<OrderStats stats={mockStats} isLoading={false} />);

    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("should display correct completed orders", () => {
    render(<OrderStats stats={mockStats} isLoading={false} />);

    expect(screen.getByText("138")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: LOADING STATE
// ============================================

describe("OrderStats - Loading State", () => {
  it("should show skeleton cards when loading", () => {
    const { container } = render(<OrderStats stats={mockStats} isLoading={true} />);

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render 4 skeleton cards", () => {
    const { container } = render(<OrderStats stats={mockStats} isLoading={true} />);

    const cards = container.querySelectorAll(".animate-pulse");
    expect(cards).toHaveLength(4);
  });

  it("should not show actual stats when loading", () => {
    render(<OrderStats stats={mockStats} isLoading={true} />);

    expect(screen.queryByText("150")).not.toBeInTheDocument();
    expect(screen.queryByText("R$ 450.000,00")).not.toBeInTheDocument();
  });
});

// ============================================
// TESTS: ZERO VALUES
// ============================================

describe("OrderStats - Zero Values", () => {
  it("should display zero for total orders", () => {
    render(<OrderStats stats={emptyStats} isLoading={false} />);

    const zeroTexts = screen.getAllByText("0");
    expect(zeroTexts.length).toBeGreaterThan(0);
  });

  it("should format zero revenue correctly", () => {
    render(<OrderStats stats={emptyStats} isLoading={false} />);

    expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
  });

  it("should display all cards even with zero values", () => {
    render(<OrderStats stats={emptyStats} isLoading={false} />);

    expect(screen.getByText("Total de Pedidos")).toBeInTheDocument();
    expect(screen.getByText("Receita Total")).toBeInTheDocument();
    expect(screen.getByText("Pedidos Pendentes")).toBeInTheDocument();
    expect(screen.getByText("Pedidos Completos")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: ICONS
// ============================================

describe("OrderStats - Icons", () => {
  it("should render icons for each stat card", () => {
    const { container } = render(<OrderStats stats={mockStats} isLoading={false} />);

    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThanOrEqual(4);
  });

  it("should apply correct color classes to icon containers", () => {
    const { container } = render(<OrderStats stats={mockStats} isLoading={false} />);

    expect(container.querySelector(".bg-blue-500\\/10")).toBeInTheDocument();
    expect(container.querySelector(".bg-green-500\\/10")).toBeInTheDocument();
    expect(container.querySelector(".bg-amber-500\\/10")).toBeInTheDocument();
    expect(container.querySelector(".bg-emerald-500\\/10")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: LAYOUT
// ============================================

describe("OrderStats - Layout", () => {
  it("should render in grid layout", () => {
    const { container } = render(<OrderStats stats={mockStats} isLoading={false} />);

    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
  });

  it("should have responsive grid classes", () => {
    const { container } = render(<OrderStats stats={mockStats} isLoading={false} />);

    const grid = container.querySelector(".grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4");
    expect(grid).toBeInTheDocument();
  });
});

// ============================================
// TESTS: LARGE VALUES
// ============================================

describe("OrderStats - Large Values", () => {
  it("should handle large order counts", () => {
    const largeStats: OrderStatsData = {
      totalOrders: 999999,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
    };

    render(<OrderStats stats={largeStats} isLoading={false} />);

    expect(screen.getByText("999999")).toBeInTheDocument();
  });

  it("should format large revenue correctly", () => {
    const largeStats: OrderStatsData = {
      totalOrders: 0,
      totalRevenue: 123456789000, // R$ 1.234.567.890,00
      pendingOrders: 0,
      completedOrders: 0,
    };

    render(<OrderStats stats={largeStats} isLoading={false} />);

    expect(screen.getByText("R$ 1.234.567.890,00")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("OrderStats - Edge Cases", () => {
  it("should handle negative values gracefully", () => {
    const negativeStats: OrderStatsData = {
      totalOrders: -5,
      totalRevenue: -10000,
      pendingOrders: -2,
      completedOrders: -3,
    };

    render(<OrderStats stats={negativeStats} isLoading={false} />);

    expect(screen.getByText("-5")).toBeInTheDocument();
  });

  it("should handle decimal values in revenue", () => {
    const decimalStats: OrderStatsData = {
      totalOrders: 0,
      totalRevenue: 12345, // R$ 123,45
      pendingOrders: 0,
      completedOrders: 0,
    };

    render(<OrderStats stats={decimalStats} isLoading={false} />);

    expect(screen.getByText("R$ 123,45")).toBeInTheDocument();
  });

  it("should render correctly when switching from loading to loaded", () => {
    const { rerender } = render(<OrderStats stats={mockStats} isLoading={true} />);

    expect(screen.queryByText("150")).not.toBeInTheDocument();

    rerender(<OrderStats stats={mockStats} isLoading={false} />);

    expect(screen.getByText("150")).toBeInTheDocument();
  });
});
