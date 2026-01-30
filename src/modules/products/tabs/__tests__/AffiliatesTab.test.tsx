/**
 * AffiliatesTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Affiliates tab component that manages affiliate program settings.
 * 
 * @module test/modules/products/tabs/AffiliatesTab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AffiliatesTab } from "../affiliates/AffiliatesTab";
import * as AffiliatesModule from "../affiliates/useAffiliatesTab";
import * as ProductContext from "../../context/ProductContext";

// Mock dependencies
vi.mock("../affiliates/useAffiliatesTab", () => ({
  useAffiliatesTab: vi.fn(),
}));

vi.mock("../../context/ProductContext", () => ({
  useProductContext: vi.fn(),
}));

vi.mock("../affiliates/components", () => ({
  AffiliateProgramStatus: vi.fn(() => <div data-testid="affiliate-program-status">Program Status</div>),
  AffiliateInviteLink: vi.fn(() => <div data-testid="affiliate-invite-link">Invite Link</div>),
  CommissionSettings: vi.fn(() => <div data-testid="commission-settings">Commission Settings</div>),
  AdvancedRules: vi.fn(() => <div data-testid="advanced-rules">Advanced Rules</div>),
  SupportContact: vi.fn(() => <div data-testid="support-contact">Support Contact</div>),
}));

vi.mock("../../components/MarketplaceSettings", () => ({
  MarketplaceSettings: vi.fn(() => <div data-testid="marketplace-settings">Marketplace Settings</div>),
}));

vi.mock("../../components/AffiliateGatewaySettings", () => ({
  AffiliateGatewaySettings: vi.fn(() => <div data-testid="affiliate-gateway-settings">Gateway Settings</div>),
}));

describe("AffiliatesTab", () => {
  const mockProduct = {
    id: "product-123",
    name: "Test Product",
  };

  const defaultHookReturn = {
    product: mockProduct,
    localSettings: {
      enabled: false,
      commissionPercentage: 10,
      cookieDuration: 30,
      showInMarketplace: false,
      marketplaceDescription: "",
      marketplaceCategory: "",
    },
    gatewaySettings: {
      pixGateway: null,
      creditCardGateway: null,
    },
    handleChange: vi.fn(),
    handleGatewaySettingsChange: vi.fn(),
  };

  const defaultContextReturn = {
    saving: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AffiliatesModule.useAffiliatesTab).mockReturnValue(defaultHookReturn as never);
    vi.mocked(ProductContext.useProductContext).mockReturnValue(defaultContextReturn as never);
  });

  describe("loading state", () => {
    it("should show loading spinner when product is not loaded", () => {
      vi.mocked(AffiliatesModule.useAffiliatesTab).mockReturnValue({
        ...defaultHookReturn,
        product: null,
      } as never);

      const { container } = render(<AffiliatesTab />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should show loading spinner when product id is missing", () => {
      vi.mocked(AffiliatesModule.useAffiliatesTab).mockReturnValue({
        ...defaultHookReturn,
        product: { id: "" },
      } as never);

      const { container } = render(<AffiliatesTab />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should not render components when loading", () => {
      vi.mocked(AffiliatesModule.useAffiliatesTab).mockReturnValue({
        ...defaultHookReturn,
        product: null,
      } as never);

      render(<AffiliatesTab />);

      expect(screen.queryByTestId("affiliate-program-status")).not.toBeInTheDocument();
    });
  });

  describe("affiliate program disabled", () => {
    it("should render AffiliateProgramStatus when program is disabled", () => {
      render(<AffiliatesTab />);

      expect(screen.getByTestId("affiliate-program-status")).toBeInTheDocument();
    });

    it("should not render other components when program is disabled", () => {
      render(<AffiliatesTab />);

      expect(screen.queryByTestId("affiliate-invite-link")).not.toBeInTheDocument();
      expect(screen.queryByTestId("commission-settings")).not.toBeInTheDocument();
      expect(screen.queryByTestId("advanced-rules")).not.toBeInTheDocument();
    });

    it("should render card header with title and description", () => {
      render(<AffiliatesTab />);

      expect(screen.getByText("Programa de Afiliados")).toBeInTheDocument();
      expect(screen.getByText("Configure e gerencie seu programa de afiliados")).toBeInTheDocument();
    });
  });

  describe("affiliate program enabled", () => {
    beforeEach(() => {
      vi.mocked(AffiliatesModule.useAffiliatesTab).mockReturnValue({
        ...defaultHookReturn,
        localSettings: {
          ...defaultHookReturn.localSettings,
          enabled: true,
        },
      } as never);
    });

    it("should render all affiliate components when enabled", () => {
      render(<AffiliatesTab />);

      expect(screen.getByTestId("affiliate-program-status")).toBeInTheDocument();
      expect(screen.getByTestId("affiliate-invite-link")).toBeInTheDocument();
      expect(screen.getByTestId("marketplace-settings")).toBeInTheDocument();
      expect(screen.getByTestId("commission-settings")).toBeInTheDocument();
      expect(screen.getByTestId("advanced-rules")).toBeInTheDocument();
      expect(screen.getByTestId("affiliate-gateway-settings")).toBeInTheDocument();
      expect(screen.getByTestId("support-contact")).toBeInTheDocument();
    });

    it("should render components in correct order", () => {
      const { container } = render(<AffiliatesTab />);

      const components = container.querySelectorAll("[data-testid]");
      const testIds = Array.from(components).map((el) => el.getAttribute("data-testid"));

      expect(testIds).toEqual([
        "affiliate-program-status",
        "affiliate-invite-link",
        "marketplace-settings",
        "commission-settings",
        "advanced-rules",
        "affiliate-gateway-settings",
        "support-contact",
      ]);
    });
  });

  describe("hook integration", () => {
    it("should call useAffiliatesTab hook", () => {
      render(<AffiliatesTab />);

      expect(AffiliatesModule.useAffiliatesTab).toHaveBeenCalledTimes(1);
    });

    it("should call useProductContext hook", () => {
      render(<AffiliatesTab />);

      expect(ProductContext.useProductContext).toHaveBeenCalledTimes(1);
    });
  });

  describe("marketplace settings", () => {
    beforeEach(() => {
      vi.mocked(AffiliatesModule.useAffiliatesTab).mockReturnValue({
        ...defaultHookReturn,
        localSettings: {
          ...defaultHookReturn.localSettings,
          enabled: true,
          showInMarketplace: true,
          marketplaceDescription: "Test description",
          marketplaceCategory: "digital",
        },
      } as never);
    });

    it("should render marketplace settings when enabled", () => {
      render(<AffiliatesTab />);

      expect(screen.getByTestId("marketplace-settings")).toBeInTheDocument();
    });
  });

  describe("gateway settings", () => {
    beforeEach(() => {
      vi.mocked(AffiliatesModule.useAffiliatesTab).mockReturnValue({
        ...defaultHookReturn,
        localSettings: {
          ...defaultHookReturn.localSettings,
          enabled: true,
        },
        gatewaySettings: {
          pixGateway: "pushinpay",
          creditCardGateway: "stripe",
        },
      } as never);
    });

    it("should render gateway settings when program is enabled", () => {
      render(<AffiliatesTab />);

      expect(screen.getByTestId("affiliate-gateway-settings")).toBeInTheDocument();
    });
  });

  describe("saving state", () => {
    beforeEach(() => {
      vi.mocked(AffiliatesModule.useAffiliatesTab).mockReturnValue({
        ...defaultHookReturn,
        localSettings: {
          ...defaultHookReturn.localSettings,
          enabled: true,
        },
      } as never);

      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        saving: true,
      } as never);
    });

    it("should still render components when saving", () => {
      render(<AffiliatesTab />);

      expect(screen.getByTestId("affiliate-program-status")).toBeInTheDocument();
      expect(screen.getByTestId("affiliate-gateway-settings")).toBeInTheDocument();
    });
  });
});
