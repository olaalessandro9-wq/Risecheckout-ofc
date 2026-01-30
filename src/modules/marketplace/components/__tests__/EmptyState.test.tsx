/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * EmptyState - Testes Unitários
 * 
 * Testa o componente de estado vazio do marketplace.
 * Cobre renderização, tipos de estado, mensagens customizadas e ícones.
 * 
 * @version 1.0.0
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "../EmptyState";

// ============================================
// TESTS: RENDERING - NO PRODUCTS
// ============================================

describe("EmptyState - No Products", () => {
  it("should render card container", () => {
    const { container } = render(<EmptyState type="no-products" />);
    const card = container.querySelector('[class*="border-dashed"]');
    expect(card).toBeInTheDocument();
  });

  it("should render Store icon", () => {
    const { container } = render(<EmptyState type="no-products" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("should render default title", () => {
    render(<EmptyState type="no-products" />);
    expect(screen.getByText("Nenhum produto disponível")).toBeInTheDocument();
  });

  it("should render default description", () => {
    render(<EmptyState type="no-products" />);
    expect(screen.getByText("Ainda não há produtos no marketplace. Volte mais tarde!")).toBeInTheDocument();
  });

  it("should render custom message", () => {
    render(<EmptyState type="no-products" message="Mensagem customizada" />);
    expect(screen.getByText("Mensagem customizada")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: RENDERING - NO RESULTS
// ============================================

describe("EmptyState - No Results", () => {
  it("should render Search icon", () => {
    const { container } = render(<EmptyState type="no-results" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("should render no results title", () => {
    render(<EmptyState type="no-results" />);
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
  });

  it("should render no results description", () => {
    render(<EmptyState type="no-results" />);
    expect(screen.getByText("Tente ajustar os filtros ou buscar por outros termos.")).toBeInTheDocument();
  });

  it("should render custom message for no results", () => {
    render(<EmptyState type="no-results" message="Busca sem resultados" />);
    expect(screen.getByText("Busca sem resultados")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: RENDERING - NO CATEGORY
// ============================================

describe("EmptyState - No Category", () => {
  it("should render Filter icon", () => {
    const { container } = render(<EmptyState type="no-category" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("should render no category title", () => {
    render(<EmptyState type="no-category" />);
    expect(screen.getByText("Nenhum produto nesta categoria")).toBeInTheDocument();
  });

  it("should render no category description", () => {
    render(<EmptyState type="no-category" />);
    expect(screen.getByText("Selecione outra categoria ou remova os filtros.")).toBeInTheDocument();
  });

  it("should render custom message for no category", () => {
    render(<EmptyState type="no-category" message="Categoria vazia" />);
    expect(screen.getByText("Categoria vazia")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: DEFAULT BEHAVIOR
// ============================================

describe("EmptyState - Default Behavior", () => {
  it("should default to no-products type when no type provided", () => {
    render(<EmptyState />);
    expect(screen.getByText("Nenhum produto disponível")).toBeInTheDocument();
  });

  it("should render icon container with correct classes", () => {
    const { container } = render(<EmptyState />);
    const iconContainer = container.querySelector('.rounded-full.bg-muted');
    expect(iconContainer).toBeInTheDocument();
  });

  it("should have centered content", () => {
    const { container } = render(<EmptyState />);
    const content = container.querySelector('.flex.flex-col.items-center');
    expect(content).toBeInTheDocument();
  });
});

// ============================================
// TESTS: STYLING
// ============================================

describe("EmptyState - Styling", () => {
  it("should have dashed border on card", () => {
    const { container } = render(<EmptyState />);
    const card = container.querySelector('[class*="border-dashed"]');
    expect(card).toBeInTheDocument();
  });

  it("should have proper padding", () => {
    const { container } = render(<EmptyState />);
    const content = container.querySelector('.py-16');
    expect(content).toBeInTheDocument();
  });

  it("should have text-center class", () => {
    const { container } = render(<EmptyState />);
    const content = container.querySelector('.text-center');
    expect(content).toBeInTheDocument();
  });

  it("should have max-width on description", () => {
    const { container } = render(<EmptyState />);
    const description = container.querySelector('.max-w-md');
    expect(description).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("EmptyState - Edge Cases", () => {
  it("should handle empty string message", () => {
    render(<EmptyState type="no-products" message="" />);
    expect(screen.getByText("Ainda não há produtos no marketplace. Volte mais tarde!")).toBeInTheDocument();
  });

  it("should handle very long custom message", () => {
    const longMessage = "A".repeat(200);
    render(<EmptyState type="no-products" message={longMessage} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it("should handle special characters in message", () => {
    const specialMessage = "Teste <>&\"'";
    render(<EmptyState type="no-products" message={specialMessage} />);
    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });
});
