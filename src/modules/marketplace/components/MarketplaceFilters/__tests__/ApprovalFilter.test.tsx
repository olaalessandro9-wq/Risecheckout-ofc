/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * ApprovalFilter - Testes Unitários
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ApprovalFilter } from "../ApprovalFilter";

const mockOnApprovalChange = vi.fn();
const mockOnSelectAll = vi.fn();

describe("ApprovalFilter", () => {
  it("should render label", () => {
    render(<ApprovalFilter filters={{}} onApprovalChange={mockOnApprovalChange} onSelectAll={mockOnSelectAll} />);
    expect(screen.getByText("Aprovação")).toBeInTheDocument();
  });

  it("should render immediate checkbox", () => {
    render(<ApprovalFilter filters={{}} onApprovalChange={mockOnApprovalChange} onSelectAll={mockOnSelectAll} />);
    expect(screen.getByText("Imediata")).toBeInTheDocument();
  });

  it("should render moderation checkbox", () => {
    render(<ApprovalFilter filters={{}} onApprovalChange={mockOnApprovalChange} onSelectAll={mockOnSelectAll} />);
    expect(screen.getByText("Mediante moderação")).toBeInTheDocument();
  });

  it("should render select all button", () => {
    render(<ApprovalFilter filters={{}} onApprovalChange={mockOnApprovalChange} onSelectAll={mockOnSelectAll} />);
    expect(screen.getByText("(Selecionar todos)")).toBeInTheDocument();
  });

  it("should call onSelectAll when button clicked", () => {
    render(<ApprovalFilter filters={{}} onApprovalChange={mockOnApprovalChange} onSelectAll={mockOnSelectAll} />);
    fireEvent.click(screen.getByText("(Selecionar todos)"));
    expect(mockOnSelectAll).toHaveBeenCalled();
  });
});
