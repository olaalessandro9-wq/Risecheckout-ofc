/**
 * GeneralTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the General tab component that orchestrates product information sections.
 * 
 * @module test/modules/products/tabs/GeneralTab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GeneralTab } from "../GeneralTab";
import * as GeneralModule from "../general";

// Mock all general module exports
vi.mock("../general", () => ({
  useGeneralTab: vi.fn(),
  ProductInfoSection: vi.fn(() => <div data-testid="product-info-section">Product Info</div>),
  ProductImageSection: vi.fn(() => <div data-testid="product-image-section">Product Image</div>),
  ProductOffersSection: vi.fn(() => <div data-testid="product-offers-section">Product Offers</div>),
  ProductSupportSection: vi.fn(() => <div data-testid="product-support-section">Product Support</div>),
  ProductDeliverySection: vi.fn(() => <div data-testid="product-delivery-section">Product Delivery</div>),
}));

describe("GeneralTab", () => {
  const mockProduct = {
    id: "product-123",
    name: "Test Product",
    description: "Test Description",
    price: 9900,
    image_url: "https://example.com/image.jpg",
  };

  const defaultHookReturn = {
    product: mockProduct,
    form: {
      name: "Test Product",
      description: "Test Description",
      price: 9900,
    },
    setForm: vi.fn(),
    errors: {},
    clearError: vi.fn(),
    image: null,
    localOffers: [],
    memberGroups: [],
    hasMembersArea: false,
    handleImageFileChange: vi.fn(),
    handleImageUrlChange: vi.fn(),
    handleRemoveImage: vi.fn(),
    handleOffersChange: vi.fn(),
    handleOffersModifiedChange: vi.fn(),
    handleOfferDeleted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(GeneralModule.useGeneralTab).mockReturnValue(defaultHookReturn as never);
  });

  describe("loading state", () => {
    it("should show loading message when product is null", () => {
      vi.mocked(GeneralModule.useGeneralTab).mockReturnValue({
        ...defaultHookReturn,
        product: null,
      } as never);

      render(<GeneralTab />);

      expect(screen.getByText("Carregando produto...")).toBeInTheDocument();
    });

    it("should not render sections when product is null", () => {
      vi.mocked(GeneralModule.useGeneralTab).mockReturnValue({
        ...defaultHookReturn,
        product: null,
      } as never);

      render(<GeneralTab />);

      expect(screen.queryByTestId("product-info-section")).not.toBeInTheDocument();
      expect(screen.queryByTestId("product-image-section")).not.toBeInTheDocument();
    });
  });

  describe("sections rendering", () => {
    it("should render all five sections when product is loaded", () => {
      render(<GeneralTab />);

      expect(screen.getByTestId("product-info-section")).toBeInTheDocument();
      expect(screen.getByTestId("product-image-section")).toBeInTheDocument();
      expect(screen.getByTestId("product-offers-section")).toBeInTheDocument();
      expect(screen.getByTestId("product-support-section")).toBeInTheDocument();
      expect(screen.getByTestId("product-delivery-section")).toBeInTheDocument();
    });

    it("should render ProductInfoSection with correct props", () => {
      render(<GeneralTab />);

      expect(GeneralModule.ProductInfoSection).toHaveBeenCalledWith(
        expect.objectContaining({
          form: defaultHookReturn.form,
          setForm: defaultHookReturn.setForm,
          errors: defaultHookReturn.errors,
          clearError: defaultHookReturn.clearError,
        }),
        expect.anything()
      );
    });

    it("should render ProductImageSection with correct props", () => {
      render(<GeneralTab />);

      expect(GeneralModule.ProductImageSection).toHaveBeenCalledWith(
        expect.objectContaining({
          currentImageUrl: mockProduct.image_url,
          image: defaultHookReturn.image,
          onImageFileChange: defaultHookReturn.handleImageFileChange,
          onImageUrlChange: defaultHookReturn.handleImageUrlChange,
          onRemoveImage: defaultHookReturn.handleRemoveImage,
        }),
        expect.anything()
      );
    });

    it("should render ProductOffersSection with correct props", () => {
      render(<GeneralTab />);

      expect(GeneralModule.ProductOffersSection).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: mockProduct.id,
          form: defaultHookReturn.form,
          offers: defaultHookReturn.localOffers,
          onOffersChange: defaultHookReturn.handleOffersChange,
          onModifiedChange: defaultHookReturn.handleOffersModifiedChange,
          onOfferDeleted: defaultHookReturn.handleOfferDeleted,
          memberGroups: defaultHookReturn.memberGroups,
          hasMembersArea: defaultHookReturn.hasMembersArea,
        }),
        expect.anything()
      );
    });

    it("should render ProductSupportSection with correct props", () => {
      render(<GeneralTab />);

      expect(GeneralModule.ProductSupportSection).toHaveBeenCalledWith(
        expect.objectContaining({
          form: defaultHookReturn.form,
          setForm: defaultHookReturn.setForm,
          errors: defaultHookReturn.errors,
          clearError: defaultHookReturn.clearError,
        }),
        expect.anything()
      );
    });

    it("should render ProductDeliverySection with correct props", () => {
      render(<GeneralTab />);

      expect(GeneralModule.ProductDeliverySection).toHaveBeenCalledWith(
        expect.objectContaining({
          form: defaultHookReturn.form,
          setForm: defaultHookReturn.setForm,
        }),
        expect.anything()
      );
    });
  });

  describe("hook integration", () => {
    it("should call useGeneralTab hook", () => {
      render(<GeneralTab />);

      expect(GeneralModule.useGeneralTab).toHaveBeenCalledTimes(1);
    });

    it("should handle hook with offers", () => {
      const mockOffers = [
        { id: "offer-1", name: "Offer 1", price: 4900 },
        { id: "offer-2", name: "Offer 2", price: 7900 },
      ];

      vi.mocked(GeneralModule.useGeneralTab).mockReturnValue({
        ...defaultHookReturn,
        localOffers: mockOffers,
      } as never);

      render(<GeneralTab />);

      expect(GeneralModule.ProductOffersSection).toHaveBeenCalledWith(
        expect.objectContaining({
          offers: mockOffers,
        }),
        expect.anything()
      );
    });

    it("should handle hook with member groups", () => {
      const mockMemberGroups = [
        { id: "group-1", name: "Group 1" },
        { id: "group-2", name: "Group 2" },
      ];

      vi.mocked(GeneralModule.useGeneralTab).mockReturnValue({
        ...defaultHookReturn,
        memberGroups: mockMemberGroups,
        hasMembersArea: true,
      } as never);

      render(<GeneralTab />);

      expect(GeneralModule.ProductOffersSection).toHaveBeenCalledWith(
        expect.objectContaining({
          memberGroups: mockMemberGroups,
          hasMembersArea: true,
        }),
        expect.anything()
      );
    });

    it("should handle hook with form errors", () => {
      const mockErrors = {
        name: "Nome é obrigatório",
        price: "Preço inválido",
      };

      vi.mocked(GeneralModule.useGeneralTab).mockReturnValue({
        ...defaultHookReturn,
        errors: mockErrors,
      } as never);

      render(<GeneralTab />);

      expect(GeneralModule.ProductInfoSection).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: mockErrors,
        }),
        expect.anything()
      );
    });
  });

  describe("layout structure", () => {
    it("should render sections within a card container", () => {
      const { container } = render(<GeneralTab />);

      const card = container.querySelector(".bg-card");
      expect(card).toBeInTheDocument();
    });

    it("should have proper spacing between sections", () => {
      const { container } = render(<GeneralTab />);

      const spacedContainer = container.querySelector(".space-y-8");
      expect(spacedContainer).toBeInTheDocument();
    });
  });
});
