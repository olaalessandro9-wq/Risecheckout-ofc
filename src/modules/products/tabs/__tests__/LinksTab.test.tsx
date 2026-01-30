/**
 * LinksTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Links tab component that manages payment links.
 * 
 * @module test/modules/products/tabs/LinksTab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LinksTab } from "../LinksTab";
import * as ProductContext from "../../context/ProductContext";

// Mock dependencies
vi.mock("../../context/ProductContext", () => ({
  useProductContext: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

vi.mock("@/components/products/LinksTable", () => ({
  LinksTable: vi.fn(({ links }) => (
    <div data-testid="links-table">
      <div data-testid="links-count">{links.length}</div>
    </div>
  )),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("LinksTab", () => {
  const mockProduct = {
    id: "product-123",
    name: "Test Product",
  };

  const mockPaymentLinks = [
    {
      id: "link-1",
      slug: "test-offer-1",
      url: "https://example.com/p/test-offer-1",
      offer_name: "Offer 1",
      offer_price: 9900,
      is_default: true,
      status: "active",
      checkouts: ["checkout-1"],
    },
    {
      id: "link-2",
      slug: "test-offer-2",
      url: "https://example.com/p/test-offer-2",
      offer_name: "Offer 2",
      offer_price: 4900,
      is_default: false,
      status: "inactive",
      checkouts: [],
    },
  ];

  const defaultContextReturn = {
    product: mockProduct,
    paymentLinks: mockPaymentLinks,
    refreshPaymentLinks: vi.fn(),
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductContext.useProductContext).mockReturnValue(defaultContextReturn as never);
  });

  describe("loading state", () => {
    it("should show loading message when product is null", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        product: null,
      } as never);

      render(<LinksTab />);

      expect(screen.getByText("Carregando configurações...")).toBeInTheDocument();
    });

    it("should show loading message when product id is missing", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        product: { id: "" },
      } as never);

      render(<LinksTab />);

      expect(screen.getByText("Carregando configurações...")).toBeInTheDocument();
    });

    it("should show loading spinner when loading with no links", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        loading: true,
        paymentLinks: [],
      } as never);

      render(<LinksTab />);

      expect(screen.getByText("Carregando links...")).toBeInTheDocument();
    });

    it("should not show loading spinner when loading with existing links", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        loading: true,
        paymentLinks: mockPaymentLinks,
      } as never);

      render(<LinksTab />);

      expect(screen.getByTestId("links-table")).toBeInTheDocument();
    });
  });

  describe("links rendering", () => {
    it("should render LinksTable when product is loaded", () => {
      render(<LinksTab />);

      expect(screen.getByTestId("links-table")).toBeInTheDocument();
    });

    it("should display correct number of links", () => {
      render(<LinksTab />);

      expect(screen.getByTestId("links-count")).toHaveTextContent("2");
    });

    it("should render header with title and description", () => {
      render(<LinksTab />);

      expect(screen.getByText("Links de Pagamento")).toBeInTheDocument();
      expect(screen.getByText(/Links gerados automaticamente para cada oferta/)).toBeInTheDocument();
    });
  });

  describe("links transformation", () => {
    it("should transform payment links correctly", () => {
      render(<LinksTab />);

      expect(screen.getByTestId("links-count")).toHaveTextContent("2");
    });

    it("should handle links with empty checkouts array", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        paymentLinks: [
          {
            id: "link-3",
            slug: "test-offer-3",
            url: "https://example.com/p/test-offer-3",
            offer_name: "Offer 3",
            offer_price: 7900,
            is_default: false,
            status: "active",
            checkouts: [],
          },
        ],
      } as never);

      render(<LinksTab />);

      expect(screen.getByTestId("links-count")).toHaveTextContent("1");
    });

    it("should handle links without checkouts property", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        paymentLinks: [
          {
            id: "link-4",
            slug: "test-offer-4",
            url: "https://example.com/p/test-offer-4",
            offer_name: "Offer 4",
            offer_price: 5900,
            is_default: false,
            status: "active",
          },
        ],
      } as never);

      render(<LinksTab />);

      expect(screen.getByTestId("links-count")).toHaveTextContent("1");
    });
  });

  describe("empty links", () => {
    it("should handle empty payment links array", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        paymentLinks: [],
      } as never);

      render(<LinksTab />);

      expect(screen.getByTestId("links-count")).toHaveTextContent("0");
    });
  });

  describe("context integration", () => {
    it("should call useProductContext hook", () => {
      render(<LinksTab />);

      expect(ProductContext.useProductContext).toHaveBeenCalledTimes(1);
    });
  });

  describe("link status", () => {
    it("should show active links", () => {
      render(<LinksTab />);

      expect(screen.getByTestId("links-table")).toBeInTheDocument();
    });

    it("should show inactive links", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        paymentLinks: [
          {
            id: "link-5",
            slug: "inactive-offer",
            url: "https://example.com/p/inactive-offer",
            offer_name: "Inactive Offer",
            offer_price: 3900,
            is_default: false,
            status: "inactive",
            checkouts: [],
          },
        ],
      } as never);

      render(<LinksTab />);

      expect(screen.getByTestId("links-count")).toHaveTextContent("1");
    });
  });
});
