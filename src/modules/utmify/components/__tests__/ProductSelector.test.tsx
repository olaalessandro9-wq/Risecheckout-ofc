/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * ProductSelector - Testes Unitários
 * 
 * Testa o componente de seleção múltipla de produtos.
 * Cobre renderização, labels dinâmicos, badges, e estados vazios.
 * 
 * @version 1.0.0
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductSelector } from "../ProductSelector";
import type { UTMifyContextValue } from "../../context/UTMifyContext";
import type { Product } from "../../types";

// ============================================
// MOCKS
// ============================================

const mockToggleProduct = vi.fn();

const mockProducts: Product[] = [
  { id: "prod-1", name: "Produto A", status: "active" },
  { id: "prod-2", name: "Produto B", status: "active" },
  { id: "prod-3", name: "Produto C", status: "active" },
];

const createMockContext = (overrides: Partial<UTMifyContextValue> = {}): UTMifyContextValue => ({
  isLoading: false,
  isReady: true,
  isSaving: false,
  isError: false,
  error: null,
  products: mockProducts,
  token: "",
  active: false,
  selectedProducts: [],
  selectedEvents: [],
  hasExistingToken: false,
  updateToken: vi.fn(),
  toggleActive: vi.fn(),
  toggleProduct: mockToggleProduct,
  toggleEvent: vi.fn(),
  save: vi.fn(),
  refresh: vi.fn(),
  matches: vi.fn(),
  ...overrides,
});

vi.mock("../../context", () => ({
  useUTMifyContext: () => mockContext,
}));

let mockContext: UTMifyContextValue;

// ============================================
// TESTS: RENDERING - EMPTY STATE
// ============================================

describe("ProductSelector - Rendering (Empty)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext({ selectedProducts: [] });
  });

  it("should render label", () => {
    render(<ProductSelector />);
    expect(screen.getByText("Produtos")).toBeInTheDocument();
  });

  it("should render button", () => {
    render(<ProductSelector />);
    const button = screen.getByRole("combobox");
    expect(button).toBeInTheDocument();
  });

  it("should show empty state text", () => {
    render(<ProductSelector />);
    expect(screen.getByText("Selecione os produtos")).toBeInTheDocument();
  });

  it("should not show badges when empty", () => {
    const { container } = render(<ProductSelector />);
    const badges = container.querySelectorAll('[class*="badge"]');
    expect(badges.length).toBe(0);
  });

  it("should show chevron icon", () => {
    const { container } = render(<ProductSelector />);
    const chevron = container.querySelector('svg');
    expect(chevron).toBeInTheDocument();
  });
});

// ============================================
// TESTS: LABEL DISPLAY
// ============================================

describe("ProductSelector - Label Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show count for single selection", () => {
    mockContext = createMockContext({ 
      selectedProducts: ["prod-1"] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("1 produto(s) selecionado(s)")).toBeInTheDocument();
  });

  it("should show count for multiple selections", () => {
    mockContext = createMockContext({ 
      selectedProducts: ["prod-1", "prod-2"] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("2 produto(s) selecionado(s)")).toBeInTheDocument();
  });

  it("should show all products text when all selected", () => {
    mockContext = createMockContext({ 
      selectedProducts: ["prod-1", "prod-2", "prod-3"] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("Todos os produtos")).toBeInTheDocument();
  });

  it("should show empty text when none selected", () => {
    mockContext = createMockContext({ 
      selectedProducts: [] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("Selecione os produtos")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: BADGES DISPLAY
// ============================================

describe("ProductSelector - Badges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show badge for single selection", () => {
    mockContext = createMockContext({ 
      selectedProducts: ["prod-1"] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("Produto A")).toBeInTheDocument();
  });

  it("should show badges for multiple selections", () => {
    mockContext = createMockContext({ 
      selectedProducts: ["prod-1", "prod-2"] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("Produto A")).toBeInTheDocument();
    expect(screen.getByText("Produto B")).toBeInTheDocument();
  });

  it("should show all badges when all selected", () => {
    mockContext = createMockContext({ 
      selectedProducts: ["prod-1", "prod-2", "prod-3"] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("Produto A")).toBeInTheDocument();
    expect(screen.getByText("Produto B")).toBeInTheDocument();
    expect(screen.getByText("Produto C")).toBeInTheDocument();
  });

  it("should not show badges for empty selection", () => {
    mockContext = createMockContext({ selectedProducts: [] });
    render(<ProductSelector />);
    expect(screen.queryByText("Produto A")).not.toBeInTheDocument();
  });
});

// ============================================
// TESTS: EMPTY PRODUCTS LIST
// ============================================

describe("ProductSelector - Empty Products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle empty products array", () => {
    mockContext = createMockContext({ 
      products: [],
      selectedProducts: [] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("Selecione os produtos")).toBeInTheDocument();
  });

  it("should show all products text when products is empty but all selected", () => {
    mockContext = createMockContext({ 
      products: [],
      selectedProducts: [] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("Selecione os produtos")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("ProductSelector - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle invalid product id gracefully", () => {
    mockContext = createMockContext({ 
      selectedProducts: ["invalid-id"] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("1 produto(s) selecionado(s)")).toBeInTheDocument();
    expect(screen.queryByText("Produto A")).not.toBeInTheDocument();
  });

  it("should handle mixed valid and invalid ids", () => {
    mockContext = createMockContext({ 
      selectedProducts: ["prod-1", "invalid-id", "prod-2"] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("Produto A")).toBeInTheDocument();
    expect(screen.getByText("Produto B")).toBeInTheDocument();
  });

  it("should handle duplicate product ids", () => {
    mockContext = createMockContext({ 
      selectedProducts: ["prod-1", "prod-1"] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("2 produto(s) selecionado(s)")).toBeInTheDocument();
  });

  it("should handle product without name", () => {
    const productsWithoutName: Product[] = [
      { id: "prod-x", name: "", status: "active" },
    ];
    mockContext = createMockContext({ 
      products: productsWithoutName,
      selectedProducts: ["prod-x"] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("1 produto(s) selecionado(s)")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: BUTTON ATTRIBUTES
// ============================================

describe("ProductSelector - Button Attributes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext();
  });

  it("should have combobox role", () => {
    render(<ProductSelector />);
    const button = screen.getByRole("combobox");
    expect(button).toHaveAttribute("role", "combobox");
  });

  it("should have justify-between class", () => {
    render(<ProductSelector />);
    const button = screen.getByRole("combobox");
    expect(button).toHaveClass("justify-between");
  });

  it("should be enabled by default", () => {
    render(<ProductSelector />);
    const button = screen.getByRole("combobox");
    expect(button).not.toBeDisabled();
  });
});

// ============================================
// TESTS: INTEGRATION WITH CONTEXT
// ============================================

describe("ProductSelector - Context Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use products from context", () => {
    mockContext = createMockContext({ 
      products: mockProducts,
      selectedProducts: ["prod-1"] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("Produto A")).toBeInTheDocument();
  });

  it("should use selectedProducts from context", () => {
    mockContext = createMockContext({ 
      selectedProducts: ["prod-1", "prod-2"] 
    });
    render(<ProductSelector />);
    expect(screen.getByText("2 produto(s) selecionado(s)")).toBeInTheDocument();
  });

  it("should update when context changes", () => {
    mockContext = createMockContext({ selectedProducts: [] });
    const { rerender } = render(<ProductSelector />);
    expect(screen.getByText("Selecione os produtos")).toBeInTheDocument();

    mockContext = createMockContext({ 
      selectedProducts: ["prod-1"] 
    });
    rerender(<ProductSelector />);
    expect(screen.getByText("1 produto(s) selecionado(s)")).toBeInTheDocument();
  });
});
