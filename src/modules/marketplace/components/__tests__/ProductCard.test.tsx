/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * ProductCard - Testes Unitários
 * 
 * Testa o componente de card de produto do marketplace.
 * Cobre renderização, formatação de preços, comissão, imagens e interações.
 * 
 * @version 1.0.0
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductCard } from "../ProductCard";
import type { Database } from "@/integrations/supabase/types";

type MarketplaceProduct = Database["public"]["Views"]["marketplace_products"]["Row"];

// ============================================
// MOCKS
// ============================================

const mockOnViewDetails = vi.fn();

const createMockProduct = (overrides: Partial<MarketplaceProduct> = {}): MarketplaceProduct => ({
  id: "prod-123",
  name: "Produto Teste",
  price: 10000, // R$ 100,00 em centavos
  commission_percentage: 30,
  image_url: "https://example.com/image.jpg",
  ...overrides,
} as MarketplaceProduct);

// ============================================
// TESTS: RENDERING - BASIC
// ============================================

describe("ProductCard - Basic Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render product name", () => {
    const product = createMockProduct();
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getByText("Produto Teste")).toBeInTheDocument();
  });

  it("should render product image", () => {
    const product = createMockProduct();
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const image = screen.getByAltText("Produto Teste");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("should render card container", () => {
    const product = createMockProduct();
    const { container } = render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const card = container.querySelector('[class*="group"]');
    expect(card).toBeInTheDocument();
  });

  it("should have cursor-pointer class", () => {
    const product = createMockProduct();
    const { container } = render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const card = container.querySelector('.cursor-pointer');
    expect(card).toBeInTheDocument();
  });
});

// ============================================
// TESTS: PRICE FORMATTING
// ============================================

describe("ProductCard - Price Formatting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should format price correctly", () => {
    const product = createMockProduct({ price: 10000 });
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getByText("R$ 100,00")).toBeInTheDocument();
  });

  it("should handle zero price", () => {
    const product = createMockProduct({ price: 0 });
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
  });

  it("should handle null price", () => {
    const product = createMockProduct({ price: null });
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getAllByText("R$ 0,00").length).toBeGreaterThan(0);
  });

  it("should format large price", () => {
    const product = createMockProduct({ price: 999900 });
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getByText("R$ 9.999,00")).toBeInTheDocument();
  });

  it("should format price with cents", () => {
    const product = createMockProduct({ price: 12345 });
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getByText("R$ 123,45")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: COMMISSION CALCULATION
// ============================================

describe("ProductCard - Commission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate commission correctly", () => {
    const product = createMockProduct({ price: 10000, commission_percentage: 30 });
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getByText("R$ 30,00")).toBeInTheDocument();
  });

  it("should handle zero commission", () => {
    const product = createMockProduct({ price: 10000, commission_percentage: 0 });
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
  });

  it("should handle null commission", () => {
    const product = createMockProduct({ price: 10000, commission_percentage: null });
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
  });

  it("should calculate high commission", () => {
    const product = createMockProduct({ price: 50000, commission_percentage: 50 });
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getByText("R$ 250,00")).toBeInTheDocument();
  });

  it("should render commission label", () => {
    const product = createMockProduct();
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getByText("Comissão de até")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: IMAGE HANDLING
// ============================================

describe("ProductCard - Image Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render image when url provided", () => {
    const product = createMockProduct({ image_url: "https://example.com/test.jpg" });
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const image = screen.getByAltText("Produto Teste");
    expect(image).toHaveAttribute("src", "https://example.com/test.jpg");
  });

  it("should render placeholder when no image", () => {
    const product = createMockProduct({ image_url: null });
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getByText("📦")).toBeInTheDocument();
  });

  it("should have lazy loading", () => {
    const product = createMockProduct();
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const image = screen.getByAltText("Produto Teste");
    expect(image).toHaveAttribute("loading", "lazy");
  });

  it("should have aspect ratio container", () => {
    const product = createMockProduct();
    const { container } = render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const aspectContainer = container.querySelector('.aspect-\\[4\\/3\\]');
    expect(aspectContainer).toBeInTheDocument();
  });
});

// ============================================
// TESTS: INTERACTIONS
// ============================================

describe("ProductCard - Interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call onViewDetails when clicked", () => {
    const product = createMockProduct({ id: "prod-456" });
    const { container } = render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const card = container.querySelector('[class*="group"]');
    
    fireEvent.click(card!);
    
    expect(mockOnViewDetails).toHaveBeenCalledWith("prod-456");
  });

  it("should call onViewDetails only once per click", () => {
    const product = createMockProduct();
    const { container } = render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const card = container.querySelector('[class*="group"]');
    
    fireEvent.click(card!);
    
    expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
  });

  it("should pass correct product id", () => {
    const product = createMockProduct({ id: "test-id-123" });
    const { container } = render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const card = container.querySelector('[class*="group"]');
    
    fireEvent.click(card!);
    
    expect(mockOnViewDetails).toHaveBeenCalledWith("test-id-123");
  });
});

// ============================================
// TESTS: STYLING
// ============================================

describe("ProductCard - Styling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have hover shadow class", () => {
    const product = createMockProduct();
    const { container } = render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const card = container.querySelector('.hover\\:shadow-lg');
    expect(card).toBeInTheDocument();
  });

  it("should have transition class", () => {
    const product = createMockProduct();
    const { container } = render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const card = container.querySelector('.transition-all');
    expect(card).toBeInTheDocument();
  });

  it("should have group class for hover effects", () => {
    const product = createMockProduct();
    const { container } = render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const card = container.querySelector('.group');
    expect(card).toBeInTheDocument();
  });

  it("should have emerald color for commission", () => {
    const product = createMockProduct();
    const { container } = render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const commission = container.querySelector('.text-emerald-500');
    expect(commission).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("ProductCard - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle null product name", () => {
    const product = createMockProduct({ name: null });
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const image = screen.getByAltText("Produto");
    expect(image).toBeInTheDocument();
  });

  it("should handle very long product name", () => {
    const longName = "A".repeat(200);
    const product = createMockProduct({ name: longName });
    const { container } = render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const nameElement = container.querySelector('.line-clamp-2');
    expect(nameElement).toBeInTheDocument();
  });

  it("should handle null product id", () => {
    const product = createMockProduct({ id: null });
    const { container } = render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    const card = container.querySelector('[class*="group"]');
    
    fireEvent.click(card!);
    
    expect(mockOnViewDetails).toHaveBeenCalledWith(null);
  });

  it("should render price label", () => {
    const product = createMockProduct();
    render(<ProductCard product={product} onViewDetails={mockOnViewDetails} />);
    expect(screen.getByText("Preço máximo do produto:")).toBeInTheDocument();
  });
});
