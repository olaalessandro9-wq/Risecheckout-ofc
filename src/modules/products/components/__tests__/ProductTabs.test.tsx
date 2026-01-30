/**
 * ProductTabs Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests tab rendering, error indicators, and permission-based visibility.
 * 
 * @module test/modules/products/components/ProductTabs
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductTabs } from "../ProductTabs";
import * as ProductContext from "../../context/ProductContext";
import * as usePermissions from "@/hooks/usePermissions";

// Mock all tab components
vi.mock("../../tabs/GeneralTab", () => ({
  GeneralTab: () => <div data-testid="general-tab">General Tab Content</div>,
}));

vi.mock("../../tabs/ConfiguracoesTab", () => ({
  ConfiguracoesTab: () => <div data-testid="config-tab">Config Tab Content</div>,
}));

vi.mock("../../tabs/OrderBumpTab", () => ({
  OrderBumpTab: () => <div data-testid="orderbump-tab">OrderBump Content</div>,
}));

vi.mock("../../tabs/UpsellTab", () => ({
  UpsellTab: () => <div data-testid="upsell-tab">Upsell Content</div>,
}));

vi.mock("../../tabs/CheckoutTab", () => ({
  CheckoutTab: () => <div data-testid="checkout-tab">Checkout Content</div>,
}));

vi.mock("../../tabs/CuponsTab", () => ({
  CuponsTab: () => <div data-testid="cupons-tab">Cupons Content</div>,
}));

vi.mock("../../tabs/LinksTab", () => ({
  LinksTab: () => <div data-testid="links-tab">Links Content</div>,
}));

vi.mock("../../tabs/MembersAreaTab", () => ({
  MembersAreaTab: () => <div data-testid="members-tab">Members Content</div>,
}));

// Mock hooks
vi.mock("../../context/ProductContext", () => ({
  useProductContext: vi.fn(),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

describe("ProductTabs", () => {
  const defaultContext = {
    activeTab: "geral",
    setActiveTab: vi.fn(),
    tabErrors: {},
  };

  const defaultPermissions = {
    canHaveAffiliates: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductContext.useProductContext).mockReturnValue(defaultContext as never);
    vi.mocked(usePermissions.usePermissions).mockReturnValue(defaultPermissions as never);
  });

  describe("tab rendering", () => {
    it("should render all core tabs", () => {
      render(<ProductTabs />);

      expect(screen.getByRole("tab", { name: /geral/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /configurações/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /order bump/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /upsell/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /checkout/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /cupons/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /links/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /área de membros/i })).toBeInTheDocument();
    });

    it("should not show affiliates tab when canHaveAffiliates is false", () => {
      vi.mocked(usePermissions.usePermissions).mockReturnValue({
        canHaveAffiliates: false,
      } as never);

      render(<ProductTabs />);

      expect(screen.queryByRole("tab", { name: /afiliados/i })).not.toBeInTheDocument();
    });

    it("should show affiliates tab when canHaveAffiliates is true", () => {
      vi.mocked(usePermissions.usePermissions).mockReturnValue({
        canHaveAffiliates: true,
      } as never);

      render(<ProductTabs />);

      expect(screen.getByRole("tab", { name: /afiliados/i })).toBeInTheDocument();
    });
  });

  describe("active tab", () => {
    it("should render general tab content by default", () => {
      render(<ProductTabs />);

      expect(screen.getByTestId("general-tab")).toBeInTheDocument();
    });

    it("should render tabs as interactive elements", () => {
      render(<ProductTabs />);

      const checkoutTab = screen.getByRole("tab", { name: /checkout/i });
      expect(checkoutTab).not.toBeDisabled();
    });
  });

  describe("error indicators", () => {
    it("should show error icon on tab with errors", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContext,
        tabErrors: {
          geral: { hasError: true, errorMessage: "Required field" },
        },
      } as never);

      render(<ProductTabs />);

      const geralTab = screen.getByRole("tab", { name: /geral/i });
      expect(geralTab.querySelector("svg")).toBeInTheDocument();
    });

    it("should not show error icon on tab without errors", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContext,
        tabErrors: {
          geral: { hasError: false },
        },
      } as never);

      render(<ProductTabs />);

      const geralTab = screen.getByRole("tab", { name: /geral/i });
      expect(geralTab.querySelectorAll("svg")).toHaveLength(0);
    });

    it("should apply destructive styles to tab with errors", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContext,
        tabErrors: {
          checkout: { hasError: true },
        },
      } as never);

      render(<ProductTabs />);

      const checkoutTab = screen.getByRole("tab", { name: /checkout/i });
      expect(checkoutTab).toHaveClass("text-destructive");
    });
  });
});
