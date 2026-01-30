/**
 * ConfiguracoesTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Configuracoes tab component that manages product settings.
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

describe("ConfiguracoesTab", () => {
  const mockProduct = {
    id: "product-123",
    name: "Test Product",
  };

  const defaultContextReturn = {
    product: mockProduct,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductContext.useProductContext).mockReturnValue(defaultContextReturn as never);
  });

  describe("loading state", () => {
    it("should show loading message when product is null", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: null,
      } as never);

      render(<ConfiguracoesTab />);

      expect(screen.getByText("Carregando configurações...")).toBeInTheDocument();
    });

    it("should show loading message when product id is missing", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: { id: "" },
      } as never);

      render(<ConfiguracoesTab />);

      expect(screen.getByText("Carregando configurações...")).toBeInTheDocument();
    });

    it("should not render ProductSettingsPanel when loading", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: null,
      } as never);

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

      expect(screen.getByText(`Settings Panel for ${mockProduct.id}`)).toBeInTheDocument();
    });

    it("should render with different product id", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: { id: "different-product-456" },
      } as never);

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
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: null,
      } as never);

      const { container } = render(<ConfiguracoesTab />);

      const card = container.querySelector(".bg-card");
      expect(card).toBeInTheDocument();
    });
  });
});
