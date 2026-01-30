/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * TypeFilter - Testes Unitários
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TypeFilter } from "../TypeFilter";

const mockOnTypeChange = vi.fn();
const mockOnSelectAll = vi.fn();

describe("TypeFilter", () => {
  it("should render label", () => {
    render(<TypeFilter filters={{}} onTypeChange={mockOnTypeChange} onSelectAll={mockOnSelectAll} />);
    expect(screen.getByText("Tipo")).toBeInTheDocument();
  });

  it("should render ebook checkbox", () => {
    render(<TypeFilter filters={{}} onTypeChange={mockOnTypeChange} onSelectAll={mockOnSelectAll} />);
    expect(screen.getByText("E-book e arquivos")).toBeInTheDocument();
  });

  it("should render service checkbox", () => {
    render(<TypeFilter filters={{}} onTypeChange={mockOnTypeChange} onSelectAll={mockOnSelectAll} />);
    expect(screen.getByText("Serviço")).toBeInTheDocument();
  });

  it("should render course checkbox", () => {
    render(<TypeFilter filters={{}} onTypeChange={mockOnTypeChange} onSelectAll={mockOnSelectAll} />);
    expect(screen.getByText("Curso")).toBeInTheDocument();
  });

  it("should render select all button", () => {
    render(<TypeFilter filters={{}} onTypeChange={mockOnTypeChange} onSelectAll={mockOnSelectAll} />);
    expect(screen.getByText("(Selecionar todos)")).toBeInTheDocument();
  });

  it("should call onSelectAll when button clicked", () => {
    render(<TypeFilter filters={{}} onTypeChange={mockOnTypeChange} onSelectAll={mockOnSelectAll} />);
    fireEvent.click(screen.getByText("(Selecionar todos)"));
    expect(mockOnSelectAll).toHaveBeenCalled();
  });
});
