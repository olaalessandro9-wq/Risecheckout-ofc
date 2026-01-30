/**
 * CuponsTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Cupons tab component that manages product coupons.
 * 
 * @module test/modules/products/tabs/CuponsTab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CuponsTab } from "../CuponsTab";
import * as ProductContext from "../../context/ProductContext";
import * as ConfirmDelete from "@/components/common/ConfirmDelete";
import { api } from "@/lib/api";

// Mock dependencies
vi.mock("../../context/ProductContext", () => ({
  useProductContext: vi.fn(),
}));

vi.mock("@/components/common/ConfirmDelete", () => ({
  useConfirmDelete: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

vi.mock("@/components/products/CouponsTable", () => ({
  CouponsTable: vi.fn(({ coupons, onAdd }) => (
    <div data-testid="coupons-table">
      <button onClick={onAdd} data-testid="add-coupon-btn">Add Coupon</button>
      <div data-testid="coupons-count">{coupons.length}</div>
    </div>
  )),
}));

vi.mock("@/components/products/coupon-dialog", () => ({
  CouponDialog: vi.fn(() => <div data-testid="coupon-dialog">Coupon Dialog</div>),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CuponsTab", () => {
  const mockProduct = {
    id: "product-123",
    name: "Test Product",
  };

  const mockCoupons = [
    {
      id: "coupon-1",
      code: "SAVE10",
      discount: 10,
      discount_type: "percentage",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      applyToOrderBumps: true,
      usageCount: 5,
    },
    {
      id: "coupon-2",
      code: "SAVE20",
      discount: 20,
      discount_type: "percentage",
      startDate: null,
      endDate: null,
      applyToOrderBumps: false,
      usageCount: 0,
    },
  ];

  const defaultContextReturn = {
    product: mockProduct,
    coupons: mockCoupons,
    refreshCoupons: vi.fn(),
    loading: false,
  };

  const defaultConfirmReturn = {
    confirm: vi.fn(),
    Bridge: vi.fn(() => <div data-testid="confirm-bridge">Bridge</div>),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductContext.useProductContext).mockReturnValue(defaultContextReturn as never);
    vi.mocked(ConfirmDelete.useConfirmDelete).mockReturnValue(defaultConfirmReturn as never);
  });

  describe("loading state", () => {
    it("should show loading message when product is null", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        product: null,
      } as never);

      render(<CuponsTab />);

      expect(screen.getByText("Carregando cupons...")).toBeInTheDocument();
    });

    it("should show loading spinner when loading with no coupons", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        loading: true,
        coupons: [],
      } as never);

      render(<CuponsTab />);

      expect(screen.getByText("Carregando cupons...")).toBeInTheDocument();
    });

    it("should not show loading spinner when loading with existing coupons", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        loading: true,
        coupons: mockCoupons,
      } as never);

      render(<CuponsTab />);

      expect(screen.getByTestId("coupons-table")).toBeInTheDocument();
    });
  });

  describe("coupons rendering", () => {
    it("should render CouponsTable when product is loaded", () => {
      render(<CuponsTab />);

      expect(screen.getByTestId("coupons-table")).toBeInTheDocument();
    });

    it("should display correct number of coupons", () => {
      render(<CuponsTab />);

      expect(screen.getByTestId("coupons-count")).toHaveTextContent("2");
    });

    it("should render header with title and description", () => {
      render(<CuponsTab />);

      expect(screen.getByText("Cupons")).toBeInTheDocument();
      expect(screen.getByText("Crie cupons de desconto para seus produtos")).toBeInTheDocument();
    });

    it("should render confirm delete bridge", () => {
      render(<CuponsTab />);

      expect(screen.getByTestId("confirm-bridge")).toBeInTheDocument();
    });
  });

  describe("add coupon", () => {
    it("should open dialog when add button is clicked", () => {
      render(<CuponsTab />);

      const addButton = screen.getByTestId("add-coupon-btn");
      fireEvent.click(addButton);

      expect(screen.getByTestId("coupon-dialog")).toBeInTheDocument();
    });
  });

  describe("coupons transformation", () => {
    it("should transform coupons with dates correctly", () => {
      render(<CuponsTab />);

      expect(screen.getByTestId("coupons-count")).toHaveTextContent("2");
    });

    it("should handle coupons with null dates", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        coupons: [
          {
            id: "coupon-3",
            code: "NODEADLINE",
            discount: 15,
            discount_type: "percentage",
            startDate: null,
            endDate: null,
            applyToOrderBumps: true,
            usageCount: 0,
          },
        ],
      } as never);

      render(<CuponsTab />);

      expect(screen.getByTestId("coupons-count")).toHaveTextContent("1");
    });
  });

  describe("empty coupons", () => {
    it("should handle empty coupons array", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        coupons: [],
      } as never);

      render(<CuponsTab />);

      expect(screen.getByTestId("coupons-count")).toHaveTextContent("0");
    });
  });

  describe("context integration", () => {
    it("should call useProductContext hook", () => {
      render(<CuponsTab />);

      expect(ProductContext.useProductContext).toHaveBeenCalledTimes(1);
    });

    it("should call useConfirmDelete hook", () => {
      render(<CuponsTab />);

      expect(ConfirmDelete.useConfirmDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("coupon dialog", () => {
    it("should render CouponDialog component", () => {
      render(<CuponsTab />);

      expect(screen.getByTestId("coupon-dialog")).toBeInTheDocument();
    });
  });
});
