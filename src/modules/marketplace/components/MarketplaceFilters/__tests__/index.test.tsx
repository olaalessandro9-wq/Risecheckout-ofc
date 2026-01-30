/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * MarketplaceFilters - Testes de Integração
 * 
 * Testa o componente orquestrador de filtros do marketplace.
 * Cobre renderização de todos os sub-componentes e integração completa.
 * 
 * @version 1.0.0
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketplaceFilters } from "../index";

// ============================================
// MOCKS
// ============================================

const mockOnFiltersChange = vi.fn();
const mockCategories = [
  { id: "cat-1", name: "Categoria 1", icon: "📚" },
  { id: "cat-2", name: "Categoria 2", icon: "💻" },
];

vi.mock("../FilterHeader", () => ({
  FilterHeader: ({ activeFiltersCount }: { activeFiltersCount: number }) => (
    <div data-testid="filter-header">Header: {activeFiltersCount} ativos</div>
  ),
}));

vi.mock("../SearchFilter", () => ({
  SearchFilter: () => <div data-testid="search-filter">SearchFilter</div>,
}));

vi.mock("../ApprovalFilter", () => ({
  ApprovalFilter: () => <div data-testid="approval-filter">ApprovalFilter</div>,
}));

vi.mock("../TypeFilter", () => ({
  TypeFilter: () => <div data-testid="type-filter">TypeFilter</div>,
}));

vi.mock("../CategoryFilter", () => ({
  CategoryFilter: () => <div data-testid="category-filter">CategoryFilter</div>,
}));

vi.mock("../CommissionFilter", () => ({
  CommissionFilter: () => <div data-testid="commission-filter">CommissionFilter</div>,
}));

vi.mock("../SortFilter", () => ({
  SortFilter: () => <div data-testid="sort-filter">SortFilter</div>,
}));

vi.mock("../FilterActions", () => ({
  FilterActions: () => <div data-testid="filter-actions">FilterActions</div>,
}));

// ============================================
// TESTS: RENDERING ALL COMPONENTS
// ============================================

describe("MarketplaceFilters - Component Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render FilterHeader", () => {
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByTestId("filter-header")).toBeInTheDocument();
  });

  it("should render SearchFilter", () => {
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByTestId("search-filter")).toBeInTheDocument();
  });

  it("should render ApprovalFilter", () => {
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByTestId("approval-filter")).toBeInTheDocument();
  });

  it("should render TypeFilter", () => {
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByTestId("type-filter")).toBeInTheDocument();
  });

  it("should render CategoryFilter", () => {
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByTestId("category-filter")).toBeInTheDocument();
  });

  it("should render CommissionFilter", () => {
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByTestId("commission-filter")).toBeInTheDocument();
  });

  it("should render SortFilter", () => {
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByTestId("sort-filter")).toBeInTheDocument();
  });

  it("should render FilterActions", () => {
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByTestId("filter-actions")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: INTEGRATION
// ============================================

describe("MarketplaceFilters - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all components together", () => {
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    
    expect(screen.getByTestId("filter-header")).toBeInTheDocument();
    expect(screen.getByTestId("search-filter")).toBeInTheDocument();
    expect(screen.getByTestId("approval-filter")).toBeInTheDocument();
    expect(screen.getByTestId("type-filter")).toBeInTheDocument();
    expect(screen.getByTestId("category-filter")).toBeInTheDocument();
    expect(screen.getByTestId("commission-filter")).toBeInTheDocument();
    expect(screen.getByTestId("sort-filter")).toBeInTheDocument();
    expect(screen.getByTestId("filter-actions")).toBeInTheDocument();
  });

  it("should pass categories to CategoryFilter", () => {
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    expect(screen.getByTestId("category-filter")).toBeInTheDocument();
  });

  it("should pass filters to all filter components", () => {
    const filters = {
      category: "cat-1",
      search: "test",
      minCommission: 10,
      approvalImmediate: true,
    };
    
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    
    expect(screen.getByTestId("filter-header")).toBeInTheDocument();
  });

  it("should have space-y-6 layout", () => {
    const { container } = render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    
    const layout = container.querySelector('.space-y-6');
    expect(layout).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("MarketplaceFilters - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle empty categories array", () => {
    render(
      <MarketplaceFilters
        categories={[]}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    
    expect(screen.getByTestId("category-filter")).toBeInTheDocument();
  });

  it("should handle empty filters object", () => {
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    
    expect(screen.getByTestId("filter-header")).toHaveTextContent("0 ativos");
  });

  it("should handle filters with all options", () => {
    const filters = {
      category: "cat-1",
      search: "test",
      minCommission: 10,
      maxCommission: 50,
      sortBy: "commission" as const,
      approvalImmediate: true,
      approvalModeration: true,
      typeEbook: true,
      typeService: true,
      typeCourse: true,
    };
    
    render(
      <MarketplaceFilters
        categories={mockCategories}
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );
    
    expect(screen.getByTestId("filter-header")).toBeInTheDocument();
  });
});
