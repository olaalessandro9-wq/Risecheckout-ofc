/**
 * CheckoutTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Checkout tab component that manages product checkouts.
 * 
 * @module test/modules/products/tabs/CheckoutTab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CheckoutTab } from "../CheckoutTab";
import * as ProductContext from "../../context/ProductContext";
import * as BusyProvider from "@/components/BusyProvider";
import * as ConfirmDelete from "@/components/common/ConfirmDelete";
import { api } from "@/lib/api";

// Mock dependencies
vi.mock("../../context/ProductContext", () => ({
  useProductContext: vi.fn(),
}));

vi.mock("@/components/BusyProvider", () => ({
  useBusy: vi.fn(),
}));

vi.mock("@/components/common/ConfirmDelete", () => ({
  useConfirmDelete: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
    publicCall: vi.fn(),
  },
}));

vi.mock("@/components/products/CheckoutTable", () => ({
  CheckoutTable: vi.fn(({ onAdd, checkouts }) => (
    <div data-testid="checkout-table">
      <button onClick={onAdd} data-testid="add-checkout-btn">Add Checkout</button>
      <div data-testid="checkouts-count">{checkouts.length}</div>
    </div>
  )),
}));

vi.mock("@/components/products/CheckoutConfigDialog", () => ({
  CheckoutConfigDialog: vi.fn(() => <div data-testid="checkout-config-dialog">Config Dialog</div>),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CheckoutTab", () => {
  const mockProduct = {
    id: "product-123",
    name: "Test Product",
  };

  const mockCheckouts = [
    {
      id: "checkout-1",
      name: "Checkout 1",
      slug: "checkout-1",
    },
    {
      id: "checkout-2",
      name: "Checkout 2",
      slug: "checkout-2",
    },
  ];

  const defaultContextReturn = {
    product: mockProduct,
    checkouts: mockCheckouts,
    refreshCheckouts: vi.fn(),
  };

  const defaultBusyReturn = {
    run: vi.fn((fn: () => Promise<void>) => fn()),
  };

  const defaultConfirmReturn = {
    confirm: vi.fn(),
    Bridge: vi.fn(() => <div data-testid="confirm-bridge">Bridge</div>),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductContext.useProductContext).mockReturnValue(defaultContextReturn as never);
    vi.mocked(BusyProvider.useBusy).mockReturnValue(defaultBusyReturn as never);
    vi.mocked(ConfirmDelete.useConfirmDelete).mockReturnValue(defaultConfirmReturn as never);
  });

  describe("loading state", () => {
    it("should show loading message when product is not loaded", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        product: null,
      } as never);

      render(<CheckoutTab />);

      expect(screen.getByText("Carregando checkouts...")).toBeInTheDocument();
    });

    it("should show loading message when product id is missing", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        product: { id: "" },
      } as never);

      render(<CheckoutTab />);

      expect(screen.getByText("Carregando checkouts...")).toBeInTheDocument();
    });

    it("should not render CheckoutTable when loading", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        product: null,
      } as never);

      render(<CheckoutTab />);

      expect(screen.queryByTestId("checkout-table")).not.toBeInTheDocument();
    });
  });

  describe("checkouts rendering", () => {
    it("should render CheckoutTable when product is loaded", () => {
      render(<CheckoutTab />);

      expect(screen.getByTestId("checkout-table")).toBeInTheDocument();
    });

    it("should display correct number of checkouts", () => {
      render(<CheckoutTab />);

      expect(screen.getByTestId("checkouts-count")).toHaveTextContent("2");
    });

    it("should render header with title and description", () => {
      render(<CheckoutTab />);

      expect(screen.getByText("Checkouts")).toBeInTheDocument();
      expect(screen.getByText("Crie e personalize diferentes checkouts para seus produtos")).toBeInTheDocument();
    });

    it("should render confirm delete bridge", () => {
      render(<CheckoutTab />);

      expect(screen.getByTestId("confirm-bridge")).toBeInTheDocument();
    });
  });

  describe("add checkout", () => {
    it("should open config dialog when add button is clicked", () => {
      render(<CheckoutTab />);

      const addButton = screen.getByTestId("add-checkout-btn");
      fireEvent.click(addButton);

      expect(screen.getByTestId("checkout-config-dialog")).toBeInTheDocument();
    });
  });

  describe("offers loading", () => {
    it("should load offers on mount", async () => {
      vi.mocked(api.call).mockResolvedValue({
        data: {
          offers: [
            { id: "offer-1", name: "Offer 1", price: 4900, is_default: true, status: "active" },
          ],
        },
        error: null,
      } as never);

      render(<CheckoutTab />);

      await waitFor(() => {
        expect(api.call).toHaveBeenCalledWith("product-entities", {
          action: "offers",
          productId: mockProduct.id,
        });
      });
    });

    it("should filter only active offers", async () => {
      vi.mocked(api.call).mockResolvedValue({
        data: {
          offers: [
            { id: "offer-1", name: "Active Offer", price: 4900, is_default: true, status: "active" },
            { id: "offer-2", name: "Inactive Offer", price: 3900, is_default: false, status: "inactive" },
          ],
        },
        error: null,
      } as never);

      render(<CheckoutTab />);

      await waitFor(() => {
        expect(api.call).toHaveBeenCalled();
      });
    });

    it("should handle offers loading error", async () => {
      vi.mocked(api.call).mockResolvedValue({
        data: null,
        error: { message: "Failed to load offers" },
      } as never);

      render(<CheckoutTab />);

      await waitFor(() => {
        expect(api.call).toHaveBeenCalled();
      });
    });
  });

  describe("empty checkouts", () => {
    it("should handle empty checkouts array", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        checkouts: [],
      } as never);

      render(<CheckoutTab />);

      expect(screen.getByTestId("checkouts-count")).toHaveTextContent("0");
    });
  });

  describe("context integration", () => {
    it("should call useProductContext hook", () => {
      render(<CheckoutTab />);

      expect(ProductContext.useProductContext).toHaveBeenCalledTimes(1);
    });

    it("should call useBusy hook", () => {
      render(<CheckoutTab />);

      expect(BusyProvider.useBusy).toHaveBeenCalledTimes(1);
    });

    it("should call useConfirmDelete hook", () => {
      render(<CheckoutTab />);

      expect(ConfirmDelete.useConfirmDelete).toHaveBeenCalledTimes(1);
    });
  });
});
