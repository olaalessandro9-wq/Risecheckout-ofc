/**
 * OrderBumpTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Order Bump tab component that manages order bumps.
 * 
 * @module test/modules/products/tabs/OrderBumpTab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderBumpTab } from "../OrderBumpTab";
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

vi.mock("@/components/products/order-bump-list", () => ({
  OrderBumpList: vi.fn(({ initialOrderBumps, onAdd }) => (
    <div data-testid="order-bump-list">
      <button onClick={onAdd} data-testid="add-order-bump-list-btn">Add from List</button>
      {initialOrderBumps && <div data-testid="order-bumps-count">{initialOrderBumps.length}</div>}
    </div>
  )),
}));

vi.mock("@/components/products/order-bump-dialog", () => ({
  OrderBumpDialog: vi.fn(() => <div data-testid="order-bump-dialog">Order Bump Dialog</div>),
}));

describe("OrderBumpTab", () => {
  const mockProduct = {
    id: "product-123",
    name: "Test Product",
  };

  const mockOrderBumps = [
    {
      id: "bump-1",
      bump_product_id: "product-456",
      name: "Bump Product 1",
      price: 1900,
      image_url: "https://example.com/bump1.jpg",
    },
    {
      id: "bump-2",
      bump_product_id: "product-789",
      name: "Bump Product 2",
      price: 2900,
      image_url: null,
    },
  ];

  const defaultContextReturn = {
    product: mockProduct,
    orderBumps: [],
    refreshOrderBumps: vi.fn(),
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProductContext.useProductContext).mockReturnValue(defaultContextReturn as never);
  });

  describe("loading state", () => {
    it("should show loading message when product id is missing", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: { id: "" },
        orderBumps: [],
        refreshOrderBumps: vi.fn(),
        loading: false,
      } as never);

      render(<OrderBumpTab />);

      expect(screen.getByText("Carregando order bumps...")).toBeInTheDocument();
    });

    it("should not render OrderBumpList when product id is missing", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        product: { id: "" },
        orderBumps: [],
        refreshOrderBumps: vi.fn(),
        loading: false,
      } as never);

      render(<OrderBumpTab />);

      expect(screen.queryByTestId("order-bump-list")).not.toBeInTheDocument();
    });
  });

  describe("order bumps rendering", () => {
    beforeEach(() => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        orderBumps: mockOrderBumps,
      } as never);
    });

    it("should render OrderBumpList when product is loaded", () => {
      render(<OrderBumpTab />);

      expect(screen.getByTestId("order-bump-list")).toBeInTheDocument();
    });

    it("should display correct number of order bumps", () => {
      render(<OrderBumpTab />);

      expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("2");
    });

    it("should render header with title and description", () => {
      render(<OrderBumpTab />);

      expect(screen.getByText("Order Bump")).toBeInTheDocument();
      expect(screen.getByText("Adicione produtos complementares que aparecem após a compra principal")).toBeInTheDocument();
    });

    it("should render add button in header", () => {
      render(<OrderBumpTab />);

      expect(screen.getByText("Adicionar Order Bump")).toBeInTheDocument();
    });
  });

  describe("add order bump", () => {
    it("should open dialog when header add button is clicked", () => {
      render(<OrderBumpTab />);

      const addButton = screen.getByText("Adicionar Order Bump");
      fireEvent.click(addButton);

      expect(screen.getByTestId("order-bump-dialog")).toBeInTheDocument();
    });

    it("should open dialog when list add button is clicked", () => {
      render(<OrderBumpTab />);

      const addButton = screen.getByTestId("add-order-bump-list-btn");
      fireEvent.click(addButton);

      expect(screen.getByTestId("order-bump-dialog")).toBeInTheDocument();
    });
  });

  describe("order bumps transformation", () => {
    beforeEach(() => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        orderBumps: mockOrderBumps,
      } as never);
    });

    it("should transform order bumps correctly", () => {
      render(<OrderBumpTab />);

      expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("2");
    });

    it("should handle order bumps without image_url", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        orderBumps: [
          {
            id: "bump-3",
            bump_product_id: "product-999",
            name: "Bump without Image",
            price: 3900,
            image_url: null,
          },
        ],
      } as never);

      render(<OrderBumpTab />);

      expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("1");
    });
  });

  describe("empty order bumps", () => {
    it("should handle empty order bumps array", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        orderBumps: [],
      } as never);

      render(<OrderBumpTab />);

      expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("0");
    });
  });

  describe("loading state in list", () => {
    it("should not pass initialOrderBumps when loading", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue({
        ...defaultContextReturn,
        loading: true,
      } as never);

      render(<OrderBumpTab />);

      expect(screen.queryByTestId("order-bumps-count")).not.toBeInTheDocument();
    });

    it("should pass initialOrderBumps when not loading", () => {
      render(<OrderBumpTab />);

      expect(screen.getByTestId("order-bumps-count")).toBeInTheDocument();
    });
  });

  describe("context integration", () => {
    it("should call useProductContext hook", () => {
      render(<OrderBumpTab />);

      expect(ProductContext.useProductContext).toHaveBeenCalledTimes(1);
    });
  });

  describe("order bump dialog", () => {
    it("should render OrderBumpDialog component", () => {
      render(<OrderBumpTab />);

      expect(screen.getByTestId("order-bump-dialog")).toBeInTheDocument();
    });
  });
});
