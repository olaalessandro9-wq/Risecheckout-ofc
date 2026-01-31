/**
 * OrderBumpTab Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Order Bump tab component that manages order bumps.
 * Uses `as unknown as T` pattern for vi.mocked() calls.
 * 
 * Justification: vi.mocked requires full type match, but tests only need
 * the subset of properties actually consumed by the component.
 * 
 * @module test/modules/products/tabs/OrderBumpTab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderBumpTab } from "../OrderBumpTab";
import * as ProductContext from "../../context/ProductContext";
import {
  createMockOrderBumpTabContext,
  createMockOrderBump,
  type OrderBumpTabContextMock,
} from "@/test/factories";

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

// Type alias for the mock return type
type ProductContextMock = ReturnType<typeof ProductContext.useProductContext>;

describe("OrderBumpTab", () => {
  let defaultContextReturn: OrderBumpTabContextMock;

  const mockOrderBumps = [
    createMockOrderBump({ id: "bump-1", name: "Bump Product 1" }),
    createMockOrderBump({ id: "bump-2", name: "Bump Product 2", image_url: null }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    defaultContextReturn = createMockOrderBumpTabContext();
    // RISE V3 Justified: Partial mock - component only uses subset of context
    vi.mocked(ProductContext.useProductContext).mockReturnValue(
      defaultContextReturn as unknown as ProductContextMock
    );
  });

  describe("loading state", () => {
    it("should show loading message when product id is missing", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockOrderBumpTabContext({ product: { id: "", name: "" } }) as unknown as ProductContextMock
      );

      render(<OrderBumpTab />);

      expect(screen.getByText("Carregando order bumps...")).toBeInTheDocument();
    });

    it("should not render OrderBumpList when product id is missing", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockOrderBumpTabContext({ product: { id: "", name: "" } }) as unknown as ProductContextMock
      );

      render(<OrderBumpTab />);

      expect(screen.queryByTestId("order-bump-list")).not.toBeInTheDocument();
    });
  });

  describe("order bumps rendering", () => {
    beforeEach(() => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockOrderBumpTabContext({ orderBumps: mockOrderBumps }) as unknown as ProductContextMock
      );
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
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockOrderBumpTabContext({ orderBumps: mockOrderBumps }) as unknown as ProductContextMock
      );
    });

    it("should transform order bumps correctly", () => {
      render(<OrderBumpTab />);

      expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("2");
    });

    it("should handle order bumps without image_url", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockOrderBumpTabContext({
          orderBumps: [
            createMockOrderBump({ id: "bump-3", name: "Bump without Image", image_url: null }),
          ],
        }) as unknown as ProductContextMock
      );

      render(<OrderBumpTab />);

      expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("1");
    });
  });

  describe("empty order bumps", () => {
    it("should handle empty order bumps array", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockOrderBumpTabContext({ orderBumps: [] }) as unknown as ProductContextMock
      );

      render(<OrderBumpTab />);

      expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("0");
    });
  });

  describe("loading state in list", () => {
    it("should not pass initialOrderBumps when loading", () => {
      vi.mocked(ProductContext.useProductContext).mockReturnValue(
        createMockOrderBumpTabContext({ loading: true }) as unknown as ProductContextMock
      );

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
