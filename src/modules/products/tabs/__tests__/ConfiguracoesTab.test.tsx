/**
 * ConfiguracoesTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Configuracoes tab component that manages product settings.
 * Uses `as unknown as T` pattern for vi.mocked() calls.
 * 
 * Justification: vi.mocked requires full type match, but tests only need
 * the subset of properties actually consumed by the component.
 * 
 * @module test/modules/products/tabs/ConfiguracoesTab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfiguracoesTab } from "../ConfiguracoesTab";
import * as ProductContext from "../../context/ProductContext";

// Mock dependencies
vi.mock("../../context/ProductContext", () => ({
  useProductContext: vi.fn(),
}));

vi.mock("@/components/products/ProductSettingsPanel", () => ({
  default: vi.fn(({ productId }) => (
    <div data-testid="product-settings-panel">
      Settings Panel for {productId}
    </div>
  )),
}));

// Type alias for mock return type
type ProductContextReturn = ReturnType<typeof ProductContext.useProductContext>;

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

interface MockProductContextReturn {
  product: { id: string; name?: string } | null;
}

function createMockConfiguracoesContext(
  overrides?: Partial<MockProductContextReturn>
): MockProductContextReturn {
  return {
    product: { id: "product-123", name: "Test Product" },
    ...overrides,
  };
}

describe("ConfiguracoesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // RISE V3 Justified: Partial mock - component only uses subset of context
    vi.mocked(ProductContext.useProductContext).mockReturnValue(
      createMockConfiguracoesContext() as unknown as ProductContextReturn
    );
  });

  describe("loading state", () => {
    it("should show loading message when product is null", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockConfiguracoesContext({ product: null }) as unknown as ProductContextReturn
      );

      render(<ConfiguracoesTab />);

      expect(screen.getByText("Carregando configurações...")).toBeInTheDocument();
    });

    it("should show loading message when product id is missing", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockConfiguracoesContext({ product: { id: "" } }) as unknown as ProductContextReturn
      );

      render(<ConfiguracoesTab />);

      expect(screen.getByText("Carregando configurações...")).toBeInTheDocument();
    });

    it("should not render ProductSettingsPanel when loading", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockConfiguracoesContext({ product: null }) as unknown as ProductContextReturn
      );

      render(<ConfiguracoesTab />);

      expect(screen.queryByTestId("product-settings-panel")).not.toBeInTheDocument();
    });
  });

  describe("settings panel rendering", () => {
    it("should render ProductSettingsPanel when product is loaded", () => {
      render(<ConfiguracoesTab />);

      expect(screen.getByTestId("product-settings-panel")).toBeInTheDocument();
    });

    it("should pass product id to ProductSettingsPanel", () => {
      render(<ConfiguracoesTab />);

      expect(screen.getByText("Settings Panel for product-123")).toBeInTheDocument();
    });

    it("should render with different product id", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockConfiguracoesContext({ product: { id: "different-product-456" } }) as unknown as ProductContextReturn
      );

      render(<ConfiguracoesTab />);

      expect(screen.getByText("Settings Panel for different-product-456")).toBeInTheDocument();
    });
  });

  describe("context integration", () => {
    it("should call useProductContext hook", () => {
      render(<ConfiguracoesTab />);

      expect(ProductContext.useProductContext).toHaveBeenCalledTimes(1);
    });
  });

  describe("layout structure", () => {
    it("should render loading state within a card container", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockConfiguracoesContext({ product: null }) as unknown as ProductContextReturn
      );

      const { container } = render(<ConfiguracoesTab />);

      const card = container.querySelector(".bg-card");
      expect(card).toBeInTheDocument();
    });
  });
});
