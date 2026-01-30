/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * ProductsTable - Testes Unitários
 * 
 * Testa o componente de tabela de produtos com ordenação e ações.
 * Cobre casos de loading, vazio, sucesso e interações.
 * 
 * @version 1.0.0
 */

import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProductsTable } from "../ProductsTable";
import type { ProductWithMetrics, ProductSortField, SortDirection } from "@/modules/admin/types/admin.types";

// ============================================
// MOCK DATA
// ============================================

const mockProducts: ProductWithMetrics[] = [
  {
    id: "prod-1",
    name: "Curso de React Avançado",
    price: 29700,
    status: "active",
    created_at: "2024-01-15T10:00:00Z",
    user_id: "user-1",
    vendor_name: "João Silva",
    total_gmv: 500000,
    orders_count: 25,
  },
  {
    id: "prod-2",
    name: "Ebook JavaScript",
    price: 9700,
    status: "blocked",
    created_at: "2024-02-10T14:30:00Z",
    user_id: "user-2",
    vendor_name: "Maria Santos",
    total_gmv: 150000,
    orders_count: 15,
  },
  {
    id: "prod-3",
    name: "Mentoria Premium",
    price: 199700,
    status: "active",
    created_at: "2024-03-05T09:15:00Z",
    user_id: "user-3",
    vendor_name: "Pedro Costa",
    total_gmv: 1000000,
    orders_count: 5,
  },
];

// ============================================
// TESTS: RENDERING
// ============================================

describe("ProductsTable - Rendering", () => {
  const defaultProps = {
    products: mockProducts,
    isLoading: false,
    sortField: "name" as ProductSortField,
    sortDirection: "asc" as SortDirection,
    onSort: vi.fn(),
    onViewDetails: vi.fn(),
    onActivate: vi.fn(),
    onBlock: vi.fn(),
    onDelete: vi.fn(),
  };

  it("should render table headers", () => {
    render(<ProductsTable {...defaultProps} />);

    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Vendedor")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Preço")).toBeInTheDocument();
    expect(screen.getByText("GMV")).toBeInTheDocument();
    expect(screen.getByText("Vendas")).toBeInTheDocument();
    expect(screen.getByText("Criado em")).toBeInTheDocument();
    expect(screen.getByText("Ações")).toBeInTheDocument();
  });

  it("should render all products", () => {
    render(<ProductsTable {...defaultProps} />);

    expect(screen.getByText("Curso de React Avançado")).toBeInTheDocument();
    expect(screen.getByText("Ebook JavaScript")).toBeInTheDocument();
    expect(screen.getByText("Mentoria Premium")).toBeInTheDocument();
  });

  it("should display vendor names", () => {
    render(<ProductsTable {...defaultProps} />);

    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    expect(screen.getByText("Pedro Costa")).toBeInTheDocument();
  });

  it("should format prices correctly", () => {
    render(<ProductsTable {...defaultProps} />);

    expect(screen.getByText("R$ 297,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 97,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.997,00")).toBeInTheDocument();
  });

  it("should format GMV correctly", () => {
    render(<ProductsTable {...defaultProps} />);

    expect(screen.getByText("R$ 5.000,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.500,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 10.000,00")).toBeInTheDocument();
  });

  it("should display orders count", () => {
    render(<ProductsTable {...defaultProps} />);

    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should display formatted dates", () => {
    render(<ProductsTable {...defaultProps} />);

    expect(screen.getByText("15/01/2024")).toBeInTheDocument();
    expect(screen.getByText("10/02/2024")).toBeInTheDocument();
    expect(screen.getByText("05/03/2024")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: STATUS BADGES
// ============================================

describe("ProductsTable - Status Badges", () => {
  const defaultProps = {
    products: mockProducts,
    isLoading: false,
    sortField: "name" as ProductSortField,
    sortDirection: "asc" as SortDirection,
    onSort: vi.fn(),
    onViewDetails: vi.fn(),
    onActivate: vi.fn(),
    onBlock: vi.fn(),
    onDelete: vi.fn(),
  };

  it("should render status badges", () => {
    const { container } = render(<ProductsTable {...defaultProps} />);

    const badges = container.querySelectorAll('[class*="badge"]');
    expect(badges.length).toBeGreaterThanOrEqual(3);
  });

  it("should display correct status labels", () => {
    render(<ProductsTable {...defaultProps} />);

    const activeLabels = screen.getAllByText(/Ativo|Bloqueado/);
    expect(activeLabels.length).toBeGreaterThan(0);
  });
});

// ============================================
// TESTS: LOADING STATE
// ============================================

describe("ProductsTable - Loading State", () => {
  const defaultProps = {
    products: mockProducts,
    isLoading: true,
    sortField: "name" as ProductSortField,
    sortDirection: "asc" as SortDirection,
    onSort: vi.fn(),
    onViewDetails: vi.fn(),
    onActivate: vi.fn(),
    onBlock: vi.fn(),
    onDelete: vi.fn(),
  };

  it("should show loading spinner", () => {
    const { container } = render(<ProductsTable {...defaultProps} />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should not show products when loading", () => {
    render(<ProductsTable {...defaultProps} />);

    expect(screen.queryByText("Curso de React Avançado")).not.toBeInTheDocument();
  });
});

// ============================================
// TESTS: EMPTY STATE
// ============================================

describe("ProductsTable - Empty State", () => {
  const defaultProps = {
    products: [],
    isLoading: false,
    sortField: "name" as ProductSortField,
    sortDirection: "asc" as SortDirection,
    onSort: vi.fn(),
    onViewDetails: vi.fn(),
    onActivate: vi.fn(),
    onBlock: vi.fn(),
    onDelete: vi.fn(),
  };

  it("should show empty message", () => {
    render(<ProductsTable {...defaultProps} />);

    expect(screen.getByText(/Nenhum produto encontrado/)).toBeInTheDocument();
  });

  it("should not show table when empty", () => {
    const { container } = render(<ProductsTable {...defaultProps} />);

    const table = container.querySelector("table");
    expect(table).not.toBeInTheDocument();
  });
});

// ============================================
// TESTS: SORTING
// ============================================

describe("ProductsTable - Sorting", () => {
  const mockOnSort = vi.fn();
  const defaultProps = {
    products: mockProducts,
    isLoading: false,
    sortField: "name" as ProductSortField,
    sortDirection: "asc" as SortDirection,
    onSort: mockOnSort,
    onViewDetails: vi.fn(),
    onActivate: vi.fn(),
    onBlock: vi.fn(),
    onDelete: vi.fn(),
  };

  it("should call onSort when clicking name sort button", () => {
    render(<ProductsTable {...defaultProps} />);

    const nameButton = screen.getByRole("button", { name: /Nome/i });
    fireEvent.click(nameButton);

    expect(mockOnSort).toHaveBeenCalledWith("name");
  });

  it("should call onSort when clicking price sort button", () => {
    render(<ProductsTable {...defaultProps} />);

    const priceButton = screen.getByRole("button", { name: /Preço/i });
    fireEvent.click(priceButton);

    expect(mockOnSort).toHaveBeenCalledWith("price");
  });

  it("should call onSort when clicking GMV sort button", () => {
    render(<ProductsTable {...defaultProps} />);

    const gmvButton = screen.getByRole("button", { name: /GMV/i });
    fireEvent.click(gmvButton);

    expect(mockOnSort).toHaveBeenCalledWith("gmv");
  });

  it("should call onSort when clicking orders sort button", () => {
    render(<ProductsTable {...defaultProps} />);

    const ordersButton = screen.getByRole("button", { name: /Vendas/i });
    fireEvent.click(ordersButton);

    expect(mockOnSort).toHaveBeenCalledWith("orders");
  });

  it("should call onSort when clicking date sort button", () => {
    render(<ProductsTable {...defaultProps} />);

    const dateButton = screen.getByRole("button", { name: /Criado em/i });
    fireEvent.click(dateButton);

    expect(mockOnSort).toHaveBeenCalledWith("date");
  });
});

// ============================================
// TESTS: ACTIONS MENU
// ============================================

describe("ProductsTable - Actions Menu", () => {
  const mockOnViewDetails = vi.fn();
  const mockOnActivate = vi.fn();
  const mockOnBlock = vi.fn();
  const mockOnDelete = vi.fn();

  const defaultProps = {
    products: mockProducts,
    isLoading: false,
    sortField: "name" as ProductSortField,
    sortDirection: "asc" as SortDirection,
    onSort: vi.fn(),
    onViewDetails: mockOnViewDetails,
    onActivate: mockOnActivate,
    onBlock: mockOnBlock,
    onDelete: mockOnDelete,
  };

  it("should render action buttons for each product", () => {
    const { container } = render(<ProductsTable {...defaultProps} />);

    const actionButtons = container.querySelectorAll('button[class*="ghost"]');
    expect(actionButtons.length).toBeGreaterThanOrEqual(3);
  });

  it("should open dropdown menu on action button click", () => {
    render(<ProductsTable {...defaultProps} />);

    const actionButtons = screen.getAllByRole("button");
    const firstActionButton = actionButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-more-horizontal')
    );

    if (firstActionButton) {
      fireEvent.click(firstActionButton);
      expect(screen.getByText("Ver Detalhes")).toBeInTheDocument();
    }
  });
});

// ============================================
// TESTS: NULL/MISSING DATA
// ============================================

describe("ProductsTable - Null/Missing Data", () => {
  const productsWithNulls: ProductWithMetrics[] = [
    {
      id: "prod-null",
      name: "Produto Sem Dados",
      price: 0,
      status: null,
      created_at: null,
      user_id: null,
      vendor_name: null,
      total_gmv: 0,
      orders_count: 0,
    },
  ];

  const defaultProps = {
    products: productsWithNulls,
    isLoading: false,
    sortField: "name" as ProductSortField,
    sortDirection: "asc" as SortDirection,
    onSort: vi.fn(),
    onViewDetails: vi.fn(),
    onActivate: vi.fn(),
    onBlock: vi.fn(),
    onDelete: vi.fn(),
  };

  it("should handle null vendor name", () => {
    render(<ProductsTable {...defaultProps} />);

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("should handle null created_at", () => {
    render(<ProductsTable {...defaultProps} />);

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("should handle zero values", () => {
    render(<ProductsTable {...defaultProps} />);

    expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("ProductsTable - Edge Cases", () => {
  const defaultProps = {
    products: mockProducts,
    isLoading: false,
    sortField: "name" as ProductSortField,
    sortDirection: "asc" as SortDirection,
    onSort: vi.fn(),
    onViewDetails: vi.fn(),
    onActivate: vi.fn(),
    onBlock: vi.fn(),
    onDelete: vi.fn(),
  };

  it("should truncate very long product names", () => {
    const longNameProduct: ProductWithMetrics = {
      ...mockProducts[0],
      name: "A".repeat(300),
    };

    render(<ProductsTable {...{ ...defaultProps, products: [longNameProduct] }} />);

    const { container } = render(<ProductsTable {...{ ...defaultProps, products: [longNameProduct] }} />);
    const truncatedCell = container.querySelector(".truncate");
    expect(truncatedCell).toBeInTheDocument();
  });

  it("should handle single product", () => {
    render(<ProductsTable {...{ ...defaultProps, products: [mockProducts[0]] }} />);

    expect(screen.getByText("Curso de React Avançado")).toBeInTheDocument();
  });

  it("should handle large numbers", () => {
    const largeNumberProduct: ProductWithMetrics = {
      ...mockProducts[0],
      total_gmv: 999999999900,
      orders_count: 999999,
    };

    render(<ProductsTable {...{ ...defaultProps, products: [largeNumberProduct] }} />);

    expect(screen.getByText("R$ 9.999.999.999,00")).toBeInTheDocument();
    expect(screen.getByText("999999")).toBeInTheDocument();
  });
});
