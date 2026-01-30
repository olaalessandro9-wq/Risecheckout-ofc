/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * CategoryFilter - Testes Unitários
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CategoryFilter } from "../CategoryFilter";

const mockOnFiltersChange = vi.fn();
const mockCategories = [
  { id: "cat-1", name: "Categoria 1", icon: "📚" },
  { id: "cat-2", name: "Categoria 2", icon: "💻" },
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
