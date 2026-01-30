/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * CommissionFilter - Testes Unitários
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CommissionFilter } from "../CommissionFilter";

const mockOnFiltersChange = vi.fn();

describe("CommissionFilter", () => {
  it("should render min commission label", () => {
    render(<CommissionFilter filters={{}} onFiltersChange={mockOnFiltersChange} />);
    expect(screen.getByText("Comissão Mínima (%)")).toBeInTheDocument();
  });

  it("should render max commission label", () => {
    render(<CommissionFilter filters={{}} onFiltersChange={mockOnFiltersChange} />);
    expect(screen.getByText("Comissão Máxima (%)")).toBeInTheDocument();
  });

  it("should render min commission input", () => {
    render(<CommissionFilter filters={{}} onFiltersChange={mockOnFiltersChange} />);
    expect(screen.getByPlaceholderText("Ex: 20")).toBeInTheDocument();
  });

  it("should render max commission input", () => {
    render(<CommissionFilter filters={{}} onFiltersChange={mockOnFiltersChange} />);
    expect(screen.getByPlaceholderText("Ex: 50")).toBeInTheDocument();
  });

  it("should call onFiltersChange when min changes", () => {
    render(<CommissionFilter filters={{}} onFiltersChange={mockOnFiltersChange} />);
    const input = screen.getByPlaceholderText("Ex: 20");
    fireEvent.change(input, { target: { value: "30" } });
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it("should call onFiltersChange when max changes", () => {
    render(<CommissionFilter filters={{}} onFiltersChange={mockOnFiltersChange} />);
    const input = screen.getByPlaceholderText("Ex: 50");
    fireEvent.change(input, { target: { value: "70" } });
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it("should have number type inputs", () => {
    render(<CommissionFilter filters={{}} onFiltersChange={mockOnFiltersChange} />);
    const minInput = screen.getByPlaceholderText("Ex: 20");
    expect(minInput).toHaveAttribute("type", "number");
  });

  it("should have min/max attributes", () => {
    render(<CommissionFilter filters={{}} onFiltersChange={mockOnFiltersChange} />);
    const minInput = screen.getByPlaceholderText("Ex: 20");
    expect(minInput).toHaveAttribute("min", "0");
    expect(minInput).toHaveAttribute("max", "100");
  });
});
