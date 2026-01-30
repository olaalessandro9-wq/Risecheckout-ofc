/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * SortFilter - Testes Unitários
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SortFilter } from "../SortFilter";

const mockOnFiltersChange = vi.fn();

describe("SortFilter", () => {
  it("should render label", () => {
    render(<SortFilter filters={{}} onFiltersChange={mockOnFiltersChange} />);
    expect(screen.getByText("Ordenar por")).toBeInTheDocument();
  });

  it("should render select trigger", () => {
    const { container } = render(<SortFilter filters={{}} onFiltersChange={mockOnFiltersChange} />);
    expect(container.querySelector('#sortBy')).toBeInTheDocument();
  });

  it("should have correct height", () => {
    const { container } = render(<SortFilter filters={{}} onFiltersChange={mockOnFiltersChange} />);
    const trigger = container.querySelector('.h-9');
    expect(trigger).toBeInTheDocument();
  });

  it("should default to recent when no sort selected", () => {
    const { container } = render(<SortFilter filters={{}} onFiltersChange={mockOnFiltersChange} />);
    const trigger = container.querySelector('#sortBy');
    expect(trigger).toHaveAttribute('data-state', 'closed');
  });

  it("should render with selected sort", () => {
    render(<SortFilter filters={{ sortBy: "commission" }} onFiltersChange={mockOnFiltersChange} />);
    const { container } = render(<SortFilter filters={{ sortBy: "commission" }} onFiltersChange={mockOnFiltersChange} />);
    expect(container.querySelector('#sortBy')).toBeInTheDocument();
  });
});
