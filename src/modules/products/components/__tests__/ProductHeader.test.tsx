/**
 * ProductHeader Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests navigation, save button states, and dirty state handling.
 * 
 * @module test/modules/products/components/ProductHeader
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductHeader } from "../ProductHeader";
import * as ProductContext from "../../context/ProductContext";
import * as NavigationGuardProvider from "@/providers/NavigationGuardProvider";

// Mock dependencies
vi.mock("../../context/ProductContext", () => ({
  useProductContext: vi.fn(),
}));

vi.mock("@/providers/NavigationGuardProvider", () => ({
  useNavigationGuard: vi.fn(),
}));

describe("ProductHeader", () => {
  const defaultContext = {
    saveAll: vi.fn(),
    saving: false,
    hasUnsavedChanges: false,
  };

  const defaultGuard = {
    attemptNavigation: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductContext.useProductContext).mockReturnValue(defaultContext as never);
    vi.mocked(NavigationGuardProvider.useNavigationGuard).mockReturnValue(defaultGuard as never);
  });

  describe("back button", () => {
    it("should render back button", () => {
      render(<ProductHeader />);

      expect(screen.getByText("Voltar")).toBeInTheDocument();
    });

    it("should call attemptNavigation when back clicked", () => {
      const attemptNavigation = vi.fn();
      
      vi.mocked(NavigationGuardProvider.useNavigationGuard).mockReturnValue({
        attemptNavigation,
      } as never);

      render(<ProductHeader />);

      fireEvent.click(screen.getByText("Voltar"));

      expect(attemptNavigation).toHaveBeenCalledWith("/dashboard/produtos");
    });
  });

  describe("save button", () => {
    it("should render save button", () => {
      render(<ProductHeader />);

      expect(screen.getByText("Salvar Produto")).toBeInTheDocument();
    });

    it("should be disabled when no unsaved changes", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContext,
        hasUnsavedChanges: false,
      } as never);

      render(<ProductHeader />);

      expect(screen.getByText("Salvar Produto")).toBeDisabled();
    });

    it("should be enabled when has unsaved changes", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContext,
        hasUnsavedChanges: true,
      } as never);

      render(<ProductHeader />);

      expect(screen.getByText("Salvar Produto")).not.toBeDisabled();
    });

    it("should be disabled while saving", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContext,
        saving: true,
        hasUnsavedChanges: true,
      } as never);

      render(<ProductHeader />);

      expect(screen.getByText("Salvando...")).toBeDisabled();
    });

    it("should show saving text when saving", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContext,
        saving: true,
      } as never);

      render(<ProductHeader />);

      expect(screen.getByText("Salvando...")).toBeInTheDocument();
    });

    it("should call saveAll when clicked", () => {
      const saveAll = vi.fn();
      
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContext,
        saveAll,
        hasUnsavedChanges: true,
      } as never);

      render(<ProductHeader />);

      fireEvent.click(screen.getByText("Salvar Produto"));

      expect(saveAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("loading spinner", () => {
    it("should show spinner when saving", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContext,
        saving: true,
      } as never);

      const { container } = render(<ProductHeader />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should not show spinner when not saving", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContext,
        saving: false,
      } as never);

      const { container } = render(<ProductHeader />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeInTheDocument();
    });
  });
});
