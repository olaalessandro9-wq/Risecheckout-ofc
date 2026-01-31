/**
 * ProductHeader Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Uses `as unknown as T` pattern for vi.mocked() calls.
 * Justification: vi.mocked requires full type match, but tests only need
 * the subset of properties actually consumed by the component.
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

// Type aliases for mock return types
type ProductContextReturn = ReturnType<typeof ProductContext.useProductContext>;
type NavigationGuardReturn = ReturnType<typeof NavigationGuardProvider.useNavigationGuard>;

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

interface MockProductHeaderContext {
  saveAll: ReturnType<typeof vi.fn>;
  saving: boolean;
  hasUnsavedChanges: boolean;
}

function createMockProductHeaderContext(
  overrides?: Partial<MockProductHeaderContext>
): MockProductHeaderContext {
  return {
    saveAll: vi.fn(),
    saving: false,
    hasUnsavedChanges: false,
    ...overrides,
  };
}

interface MockNavigationGuard {
  attemptNavigation: ReturnType<typeof vi.fn>;
}

function createMockNavigationGuard(
  overrides?: Partial<MockNavigationGuard>
): MockNavigationGuard {
  return {
    attemptNavigation: vi.fn(),
    ...overrides,
  };
}

describe("ProductHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // RISE V3 Justified: Partial mock - component only uses subset of context
    vi.mocked(ProductContext.useProductContext).mockReturnValue(
      createMockProductHeaderContext() as unknown as ProductContextReturn
    );
    vi.mocked(NavigationGuardProvider.useNavigationGuard).mockReturnValue(
      createMockNavigationGuard() as unknown as NavigationGuardReturn
    );
  });

  describe("back button", () => {
    it("should render back button", () => {
      render(<ProductHeader />);

      expect(screen.getByText("Voltar")).toBeInTheDocument();
    });

    it("should call attemptNavigation when back clicked", () => {
      const attemptNavigation = vi.fn();
      
      vi.mocked(NavigationGuardProvider.useNavigationGuard).mockReturnValue(
        createMockNavigationGuard({ attemptNavigation }) as unknown as NavigationGuardReturn
      );

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
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockProductHeaderContext({ hasUnsavedChanges: false }) as unknown as ProductContextReturn
      );

      render(<ProductHeader />);

      expect(screen.getByText("Salvar Produto")).toBeDisabled();
    });

    it("should be enabled when has unsaved changes", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockProductHeaderContext({ hasUnsavedChanges: true }) as unknown as ProductContextReturn
      );

      render(<ProductHeader />);

      expect(screen.getByText("Salvar Produto")).not.toBeDisabled();
    });

    it("should be disabled while saving", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockProductHeaderContext({ saving: true, hasUnsavedChanges: true }) as unknown as ProductContextReturn
      );

      render(<ProductHeader />);

      expect(screen.getByText("Salvando...")).toBeDisabled();
    });

    it("should show saving text when saving", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockProductHeaderContext({ saving: true }) as unknown as ProductContextReturn
      );

      render(<ProductHeader />);

      expect(screen.getByText("Salvando...")).toBeInTheDocument();
    });

    it("should call saveAll when clicked", () => {
      const saveAll = vi.fn();
      
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockProductHeaderContext({ saveAll, hasUnsavedChanges: true }) as unknown as ProductContextReturn
      );

      render(<ProductHeader />);

      fireEvent.click(screen.getByText("Salvar Produto"));

      expect(saveAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("loading spinner", () => {
    it("should show spinner when saving", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockProductHeaderContext({ saving: true }) as unknown as ProductContextReturn
      );

      const { container } = render(<ProductHeader />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should not show spinner when not saving", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockProductHeaderContext({ saving: false }) as unknown as ProductContextReturn
      );

      const { container } = render(<ProductHeader />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeInTheDocument();
    });
  });
});
