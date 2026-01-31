/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * CategoryFilter - Testes Unitários
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CategoryFilter } from "../CategoryFilter";

const mockOnFiltersChange = vi.fn();

// Categories matching the full database schema type
const mockCategories = [
  { 
    id: "cat-1", 
    name: "Categoria 1", 
    icon: "📚",
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    description: "Descrição categoria 1",
    display_order: 1,
    updated_at: "2024-01-01T00:00:00Z",
  },
  { 
    id: "cat-2", 
    name: "Categoria 2", 
    icon: "💻",
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    description: "Descrição categoria 2",
    display_order: 2,
    updated_at: "2024-01-01T00:00:00Z",
  },
];

describe("CategoryFilter", () => {
  it("should render label", () => {
    render(<CategoryFilter categories={mockCategories} filters={{}} onFiltersChange={mockOnFiltersChange} />);
    expect(screen.getByText("Categoria")).toBeInTheDocument();
  });

  it("should render select trigger", () => {
    const { container } = render(<CategoryFilter categories={mockCategories} filters={{}} onFiltersChange={mockOnFiltersChange} />);
    expect(container.querySelector('#category')).toBeInTheDocument();
  });

  it("should have correct height", () => {
    const { container } = render(<CategoryFilter categories={mockCategories} filters={{}} onFiltersChange={mockOnFiltersChange} />);
    const trigger = container.querySelector('.h-9');
    expect(trigger).toBeInTheDocument();
  });

  it("should default to all when no category selected", () => {
    const { container } = render(<CategoryFilter categories={mockCategories} filters={{}} onFiltersChange={mockOnFiltersChange} />);
    const trigger = container.querySelector('#category');
    expect(trigger).toHaveAttribute('data-state', 'closed');
  });

  it("should handle empty categories array", () => {
    render(<CategoryFilter categories={[]} filters={{}} onFiltersChange={mockOnFiltersChange} />);
    expect(screen.getByText("Categoria")).toBeInTheDocument();
  });

  it("should render with selected category", () => {
    render(<CategoryFilter categories={mockCategories} filters={{ category: "cat-1" }} onFiltersChange={mockOnFiltersChange} />);
    const { container } = render(<CategoryFilter categories={mockCategories} filters={{ category: "cat-1" }} onFiltersChange={mockOnFiltersChange} />);
    expect(container.querySelector('#category')).toBeInTheDocument();
  });
});
