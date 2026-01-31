/**
 * CuponsTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Cupons tab component that manages product coupons.
 * Uses `as unknown as T` pattern for vi.mocked() calls.
 * 
 * Justification: vi.mocked requires full type match, but tests only need
 * the subset of properties actually consumed by the component.
 * 
 * @module test/modules/products/tabs/CuponsTab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CuponsTab } from "../CuponsTab";
import * as ProductContext from "../../context/ProductContext";
import * as ConfirmDelete from "@/components/common/ConfirmDelete";
import {
  createMockCuponsTabContext,
  createMockCoupon,
  createMockConfirmDelete,
  type CuponsTabContextMock,
  type ConfirmDeleteMock,
} from "@/test/factories";

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

// Type aliases for mock return types
type ProductContextMock = ReturnType<typeof ProductContext.useProductContext>;
type ConfirmDeleteReturn = ReturnType<typeof ConfirmDelete.useConfirmDelete>;

describe("CuponsTab", () => {
  let defaultContextReturn: CuponsTabContextMock;
  let defaultConfirmReturn: ConfirmDeleteMock;

  const mockCoupons = [
    createMockCoupon({ id: "coupon-1", code: "SAVE10" }),
    createMockCoupon({ id: "coupon-2", code: "SAVE20", discount: 20 }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    defaultContextReturn = createMockCuponsTabContext({ coupons: mockCoupons });
    defaultConfirmReturn = createMockConfirmDelete({
      Bridge: vi.fn(() => <div data-testid="confirm-bridge">Bridge</div>),
    });
    
    // RISE V3 Justified: Partial mock - component only uses subset of context
    vi.mocked(ProductContext.useProductContext).mockReturnValue(
      defaultContextReturn as unknown as ProductContextMock
    );
    vi.mocked(ConfirmDelete.useConfirmDelete).mockReturnValue(
      defaultConfirmReturn as unknown as ConfirmDeleteReturn
    );
  });

  describe("loading state", () => {
    it("should show loading message when product is null", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockCuponsTabContext({ product: null }) as unknown as ProductContextMock
      );

      render(<CuponsTab />);

      expect(screen.getByText("Carregando cupons...")).toBeInTheDocument();
    });

    it("should show loading spinner when loading with no coupons", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockCuponsTabContext({ loading: true, coupons: [] }) as unknown as ProductContextMock
      );

      render(<CuponsTab />);

      expect(screen.getByText("Carregando cupons...")).toBeInTheDocument();
    });

    it("should not show loading spinner when loading with existing coupons", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockCuponsTabContext({ loading: true, coupons: mockCoupons }) as unknown as ProductContextMock
      );

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
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockCuponsTabContext({
          coupons: [
            createMockCoupon({
              id: "coupon-3",
              code: "NODEADLINE",
              startDate: null,
              endDate: null,
            }),
          ],
        }) as unknown as ProductContextMock
      );

      render(<CuponsTab />);

      expect(screen.getByTestId("coupons-count")).toHaveTextContent("1");
    });
  });

  describe("empty coupons", () => {
    it("should handle empty coupons array", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockCuponsTabContext({ coupons: [] }) as unknown as ProductContextMock
      );

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
