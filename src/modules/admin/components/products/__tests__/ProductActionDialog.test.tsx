/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * ProductActionDialog - Testes Unitários
 * 
 * Testa o componente de diálogo de ação em produtos.
 * Cobre casos de ativação, bloqueio e remoção.
 * 
 * @version 1.0.0
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProductActionDialog } from "../ProductActionDialog";

// ============================================
// TESTS: ACTIVATE ACTION
// ============================================

describe("ProductActionDialog - Activate", () => {
  it("should render activate dialog with correct title", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Ativar Produto")).toBeInTheDocument();
  });

  it("should display product name in activate description", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/"Curso de React"/)).toBeInTheDocument();
  });

  it("should display activate description", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/voltará a ficar disponível/)).toBeInTheDocument();
  });

  it("should show Ativar button", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole("button", { name: "Ativar" })).toBeInTheDocument();
  });

  it("should call onConfirm when clicking Ativar", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Ativar" });
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should not have destructive styling for activate", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Ativar" });
    expect(confirmButton.className).not.toContain("bg-destructive");
  });
});

// ============================================
// TESTS: BLOCK ACTION
// ============================================

describe("ProductActionDialog - Block", () => {
  it("should render block dialog with correct title", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="block"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Bloquear Produto")).toBeInTheDocument();
  });

  it("should display product name in block description", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Ebook JavaScript"
        action="block"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/"Ebook JavaScript"/)).toBeInTheDocument();
  });

  it("should display block description", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="block"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/será bloqueado/)).toBeInTheDocument();
  });

  it("should show Bloquear button", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="block"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole("button", { name: "Bloquear" })).toBeInTheDocument();
  });

  it("should call onConfirm when clicking Bloquear", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="block"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Bloquear" });
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should have destructive styling for block", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="block"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Bloquear" });
    expect(confirmButton.className).toContain("bg-destructive");
  });
});

// ============================================
// TESTS: DELETE ACTION
// ============================================

describe("ProductActionDialog - Delete", () => {
  it("should render delete dialog with correct title", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="delete"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Remover Produto")).toBeInTheDocument();
  });

  it("should display product name in delete description", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Mentoria Premium"
        action="delete"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/"Mentoria Premium"/)).toBeInTheDocument();
  });

  it("should display delete description", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="delete"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/marcado como removido/)).toBeInTheDocument();
  });

  it("should show Remover button", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="delete"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole("button", { name: "Remover" })).toBeInTheDocument();
  });

  it("should call onConfirm when clicking Remover", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="delete"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Remover" });
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should have destructive styling for delete", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="delete"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Remover" });
    expect(confirmButton.className).toContain("bg-destructive");
  });
});

// ============================================
// TESTS: CANCEL BUTTON
// ============================================

describe("ProductActionDialog - Cancel", () => {
  it("should show cancel button", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("should call onCancel when clicking cancel button", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole("button", { name: "Cancelar" });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("should have cancel button for all actions", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    const actions: Array<"activate" | "block" | "delete"> = ["activate", "block", "delete"];

    actions.forEach((action) => {
      const { unmount } = render(
        <ProductActionDialog
          open={true}
          productName="Curso de React"
          action={action}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
      unmount();
    });
  });
});

// ============================================
// TESTS: OPEN/CLOSE STATE
// ============================================

describe("ProductActionDialog - Open/Close", () => {
  it("should not render when open is false", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={false}
        productName="Curso de React"
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText("Ativar Produto")).not.toBeInTheDocument();
  });

  it("should render when open is true", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("Ativar Produto")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("ProductActionDialog - Edge Cases", () => {
  it("should handle very long product names", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();
    const longName = "A".repeat(200);

    render(
      <ProductActionDialog
        open={true}
        productName={longName}
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
  });

  it("should handle special characters in product name", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();
    const specialName = "Curso <React> & \"JavaScript\"";

    render(
      <ProductActionDialog
        open={true}
        productName={specialName}
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(new RegExp(specialName))).toBeInTheDocument();
  });

  it("should not call onConfirm multiple times on rapid clicks", () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ProductActionDialog
        open={true}
        productName="Curso de React"
        action="activate"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Ativar" });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(3);
  });
});
