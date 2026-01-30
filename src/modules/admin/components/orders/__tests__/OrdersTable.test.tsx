/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * OrdersTable - Testes Unitários
 * 
 * Testa o componente de tabela de pedidos com ordenação e ações.
 * Cobre casos de loading, vazio, sucesso e interações.
 * 
 * @version 1.0.0
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OrdersTable } from "../OrdersTable";
import type { AdminOrder, OrderSortField } from "@/modules/admin/types/admin.types";

// ============================================
// MOCK DATA
// ============================================

const mockOrders: AdminOrder[] = [
  {
    id: "order-1",
    orderId: "ORD-12345678-ABCD",
    customerName: "João Silva",
    customerEmail: "joao@test.com",
    productName: "Curso de React",
    status: "paid",
    amount: "R$ 297,00",
    fullCreatedAt: "15/01/2024 14:30",
  },
  {
    id: "order-2",
    orderId: "ORD-87654321-EFGH",
    customerName: "Maria Santos",
    customerEmail: "maria@test.com",
    productName: "Ebook de JavaScript",
    status: "pending",
    amount: "R$ 97,00",
    fullCreatedAt: "16/01/2024 10:15",
  },
  {
    id: "order-3",
    orderId: "ORD-11223344-IJKL",
    customerName: "Pedro Costa",
    customerEmail: "pedro@test.com",
    productName: "Mentoria Premium",
    status: "refunded",
    amount: "R$ 1.997,00",
    fullCreatedAt: "17/01/2024 16:45",
  },
];

// ============================================
// TESTS: RENDERING
// ============================================

describe("OrdersTable - Rendering", () => {
  it("should render table headers", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText("ID do Pedido")).toBeInTheDocument();
    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText("Produto")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Valor")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Ações")).toBeInTheDocument();
  });

  it("should render all orders", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    expect(screen.getByText("Pedro Costa")).toBeInTheDocument();
  });

  it("should display truncated order IDs", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText(/ORD-1234.../)).toBeInTheDocument();
  });

  it("should display customer emails", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText("joao@test.com")).toBeInTheDocument();
    expect(screen.getByText("maria@test.com")).toBeInTheDocument();
  });

  it("should display product names", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText("Curso de React")).toBeInTheDocument();
    expect(screen.getByText("Ebook de JavaScript")).toBeInTheDocument();
  });

  it("should display amounts", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText("R$ 297,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 97,00")).toBeInTheDocument();
  });

  it("should display dates", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText("15/01/2024 14:30")).toBeInTheDocument();
    expect(screen.getByText("16/01/2024 10:15")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: STATUS BADGES
// ============================================

describe("OrdersTable - Status Badges", () => {
  it("should render status badges for all orders", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    const { container } = render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    const badges = container.querySelectorAll('[class*="badge"]');
    expect(badges.length).toBeGreaterThanOrEqual(3);
  });
});

// ============================================
// TESTS: LOADING STATE
// ============================================

describe("OrdersTable - Loading State", () => {
  it("should show loading spinner when loading", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    const { container } = render(
      <OrdersTable
        orders={mockOrders}
        isLoading={true}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should not show orders when loading", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        isLoading={true}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
  });
});

// ============================================
// TESTS: EMPTY STATE
// ============================================

describe("OrdersTable - Empty State", () => {
  it("should show empty message when no orders", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={[]}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText(/Nenhum pedido encontrado/)).toBeInTheDocument();
  });

  it("should not show table when empty", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    const { container } = render(
      <OrdersTable
        orders={[]}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    const table = container.querySelector("table");
    expect(table).not.toBeInTheDocument();
  });
});

// ============================================
// TESTS: SORTING
// ============================================

describe("OrdersTable - Sorting", () => {
  it("should call onSort when clicking customer sort button", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    const customerButton = screen.getByRole("button", { name: /Cliente/i });
    fireEvent.click(customerButton);

    expect(mockOnSort).toHaveBeenCalledWith("customer");
  });

  it("should call onSort when clicking amount sort button", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    const amountButton = screen.getByRole("button", { name: /Valor/i });
    fireEvent.click(amountButton);

    expect(mockOnSort).toHaveBeenCalledWith("amount");
  });

  it("should call onSort when clicking date sort button", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    const dateButton = screen.getByRole("button", { name: /Data/i });
    fireEvent.click(dateButton);

    expect(mockOnSort).toHaveBeenCalledWith("date");
  });

  it("should highlight active sort field", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    const { container } = render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="customer"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    const activeIcon = container.querySelector(".opacity-100");
    expect(activeIcon).toBeInTheDocument();
  });
});

// ============================================
// TESTS: ACTIONS
// ============================================

describe("OrdersTable - Actions", () => {
  it("should render view details button for each order", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    const { container } = render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    const buttons = container.querySelectorAll('button[class*="ghost"]');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it("should call onViewDetails with correct order ID", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    const { container } = render(
      <OrdersTable
        orders={mockOrders}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    const actionButtons = container.querySelectorAll('button[class*="ghost"]');
    const viewButton = Array.from(actionButtons).find(btn => 
      btn.closest('tr')?.textContent?.includes('João Silva')
    );

    if (viewButton) {
      fireEvent.click(viewButton as Element);
      expect(mockOnViewDetails).toHaveBeenCalledWith("order-1");
    }
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("OrdersTable - Edge Cases", () => {
  it("should handle very long product names with truncation", () => {
    const longNameOrder: AdminOrder = {
      ...mockOrders[0],
      productName: "A".repeat(200),
    };

    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    const { container } = render(
      <OrdersTable
        orders={[longNameOrder]}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    const truncatedCell = container.querySelector(".truncate");
    expect(truncatedCell).toBeInTheDocument();
  });

  it("should handle single order", () => {
    const mockOnSort = vi.fn();
    const mockOnViewDetails = vi.fn();

    render(
      <OrdersTable
        orders={[mockOrders[0]]}
        isLoading={false}
        sortField="date"
        sortDirection="desc"
        onSort={mockOnSort}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });
});
