/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * FilterActions - Testes Unitários
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterActions } from "../FilterActions";

const mockOnClearAll = vi.fn();
const mockOnApply = vi.fn();

describe("FilterActions", () => {
  it("should render clear button", () => {
    render(<FilterActions onClearAll={mockOnClearAll} onApply={mockOnApply} />);
    expect(screen.getByText("Limpar")).toBeInTheDocument();
  });

  it("should render apply button", () => {
    render(<FilterActions onClearAll={mockOnClearAll} onApply={mockOnApply} />);
    expect(screen.getByText("Aplicar")).toBeInTheDocument();
  });

  it("should call onClearAll when clear clicked", () => {
    render(<FilterActions onClearAll={mockOnClearAll} onApply={mockOnApply} />);
    fireEvent.click(screen.getByText("Limpar"));
    expect(mockOnClearAll).toHaveBeenCalled();
  });

  it("should call onApply when apply clicked", () => {
    render(<FilterActions onClearAll={mockOnClearAll} onApply={mockOnApply} />);
    fireEvent.click(screen.getByText("Aplicar"));
    expect(mockOnApply).toHaveBeenCalled();
  });

  it("should have border top", () => {
    const { container } = render(<FilterActions onClearAll={mockOnClearAll} onApply={mockOnApply} />);
    const actions = container.querySelector('.border-t');
    expect(actions).toBeInTheDocument();
  });

  it("should have flex layout", () => {
    const { container } = render(<FilterActions onClearAll={mockOnClearAll} onApply={mockOnApply} />);
    const actions = container.querySelector('.flex.gap-2');
    expect(actions).toBeInTheDocument();
  });
});
