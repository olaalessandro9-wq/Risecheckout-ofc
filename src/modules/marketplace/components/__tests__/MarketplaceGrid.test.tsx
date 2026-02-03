/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * MarketplaceGrid - Testes Unitários
 * 
 * Testa o componente de grid de produtos com infinite scroll.
 * Cobre estados de loading, vazio, com produtos, e scroll infinito.
 * 
 * @version 1.0.0
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketplaceGrid } from "../MarketplaceGrid";
import type { Database } from "@/integrations/supabase/types";

type MarketplaceProduct = Database["public"]["Views"]["marketplace_products"]["Row"];

// ============================================
// MOCKS
// ============================================

const mockOnLoadMore = vi.fn();
const mockOnViewDetails = vi.fn();

vi.mock("../ProductCard", () => ({
  ProductCard: ({ product, onViewDetails }: { product: MarketplaceProduct; onViewDetails: (id: string) => void }) => (
    <div data-testid={`product-card-${product.id}`} onClick={() => onViewDetails(product.id!)}>
      {product.name}
    </div>
  ),
}));

vi.mock("../EmptyState", () => ({
  EmptyState: ({ type }: { type: string }) => <div data-testid="empty-state">{type}</div>,
}));

const createMockProduct = (id: string, name: string): MarketplaceProduct => ({
  id,
  name,
  description: "Test description",
  price: 10000,
  image_url: null,
  status: "active",
  user_id: "user-123",
  producer_id: "user-123",
  category: "Test",
  marketplace_category: "Test",
  marketplace_enabled: true,
  marketplace_description: "Test",
  marketplace_tags: [],
  marketplace_views: 0,
  marketplace_clicks: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  commission_percentage: 30,
  requires_manual_approval: false,
  has_order_bump_commission: false,
  affiliate_enabled: true,
  vendor_name: "Test Vendor",
  producer_name: "Test Vendor",
  vendor_email: "test@example.com",
});

// ============================================
// TESTS: LOADING STATE
// ============================================

describe("MarketplaceGrid - Loading State", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show spinner when loading with no products", () => {
    render(
      <MarketplaceGrid
        products={[]}
        isLoading={true}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    const spinner = screen.getByRole("img", { hidden: true });
    expect(spinner).toBeInTheDocument();
  });

  it("should center spinner", () => {
    const { container } = render(
      <MarketplaceGrid
        products={[]}
        isLoading={true}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    const spinnerContainer = container.querySelector('.flex.items-center.justify-center');
    expect(spinnerContainer).toBeInTheDocument();
  });

  it("should have animate-spin class", () => {
    const { container } = render(
      <MarketplaceGrid
        products={[]}
        isLoading={true}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EMPTY STATE
// ============================================

describe("MarketplaceGrid - Empty State", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show EmptyState when no products and not loading", () => {
    render(
      <MarketplaceGrid
        products={[]}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("should pass no-results type to EmptyState", () => {
    render(
      <MarketplaceGrid
        products={[]}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByText("no-results")).toBeInTheDocument();
  });

  it("should not show EmptyState when loading", () => {
    render(
      <MarketplaceGrid
        products={[]}
        isLoading={true}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });

  it("should not show EmptyState when has products", () => {
    const products = [createMockProduct("1", "Product 1")];
    render(
      <MarketplaceGrid
        products={products}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });
});

// ============================================
// TESTS: PRODUCTS GRID
// ============================================

describe("MarketplaceGrid - Products Grid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render single product", () => {
    const products = [createMockProduct("1", "Product 1")];
    render(
      <MarketplaceGrid
        products={products}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByTestId("product-card-1")).toBeInTheDocument();
  });

  it("should render multiple products", () => {
    const products = [
      createMockProduct("1", "Product 1"),
      createMockProduct("2", "Product 2"),
      createMockProduct("3", "Product 3"),
    ];
    render(
      <MarketplaceGrid
        products={products}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByTestId("product-card-1")).toBeInTheDocument();
    expect(screen.getByTestId("product-card-2")).toBeInTheDocument();
    expect(screen.getByTestId("product-card-3")).toBeInTheDocument();
  });

  it("should have grid layout classes", () => {
    const products = [createMockProduct("1", "Product 1")];
    const { container } = render(
      <MarketplaceGrid
        products={products}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it("should have responsive grid columns", () => {
    const products = [createMockProduct("1", "Product 1")];
    const { container } = render(
      <MarketplaceGrid
        products={products}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    const grid = container.querySelector('.grid-cols-1');
    expect(grid).toBeInTheDocument();
  });
});

// ============================================
// TESTS: INFINITE SCROLL
// ============================================

describe("MarketplaceGrid - Infinite Scroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading spinner when hasMore and isLoading", () => {
    const products = [createMockProduct("1", "Product 1")];
    const { container } = render(
      <MarketplaceGrid
        products={products}
        isLoading={true}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    const spinners = container.querySelectorAll('.animate-spin');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it("should not show loading more when hasMore is false", () => {
    const products = [createMockProduct("1", "Product 1")];
    render(
      <MarketplaceGrid
        products={products}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByText("Você viu todos os produtos disponíveis")).toBeInTheDocument();
  });

  it("should show end message when no more products", () => {
    const products = [createMockProduct("1", "Product 1")];
    render(
      <MarketplaceGrid
        products={products}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByText("Você viu todos os produtos disponíveis")).toBeInTheDocument();
  });

  it("should not show end message when hasMore is true", () => {
    const products = [createMockProduct("1", "Product 1")];
    render(
      <MarketplaceGrid
        products={products}
        isLoading={false}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.queryByText("Você viu todos os produtos disponíveis")).not.toBeInTheDocument();
  });

  it("should not show end message when no products", () => {
    render(
      <MarketplaceGrid
        products={[]}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.queryByText("Você viu todos os produtos disponíveis")).not.toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("MarketplaceGrid - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle large number of products", () => {
    const products = Array.from({ length: 100 }, (_, i) => 
      createMockProduct(`${i}`, `Product ${i}`)
    );
    render(
      <MarketplaceGrid
        products={products}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByTestId("product-card-0")).toBeInTheDocument();
    expect(screen.getByTestId("product-card-99")).toBeInTheDocument();
  });

  it("should handle loading with existing products", () => {
    const products = [createMockProduct("1", "Product 1")];
    const { container } = render(
      <MarketplaceGrid
        products={products}
        isLoading={true}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    expect(screen.getByTestId("product-card-1")).toBeInTheDocument();
    const spinners = container.querySelectorAll('.animate-spin');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it("should have space-y-6 class on container", () => {
    const products = [createMockProduct("1", "Product 1")];
    const { container } = render(
      <MarketplaceGrid
        products={products}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onViewDetails={mockOnViewDetails}
      />
    );
    
    const spaceContainer = container.querySelector('.space-y-6');
    expect(spaceContainer).toBeInTheDocument();
  });
});
