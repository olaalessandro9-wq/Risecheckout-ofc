/**
 * CouponsTable Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for CouponsTable component covering:
 * - Table rendering
 * - Search functionality
 * - Empty states
 * - Action buttons
 * - Data formatting
 * 
 * @module components/products/__tests__/CouponsTable.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { CouponsTable, type Coupon } from "../CouponsTable";
import userEvent from "@testing-library/user-event";

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    Search: () => <div data-testid="search-icon" />,
    Plus: () => <div data-testid="plus-icon" />,
    MoreVertical: () => <div data-testid="more-icon" />,
    Pencil: () => <div data-testid="pencil-icon" />,
    Trash2: () => <div data-testid="trash-icon" />,
  };
});

describe("CouponsTable", () => {
  const mockOnAdd = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockCoupons: Coupon[] = [
    {
      id: "1",
      code: "DESCONTO10",
      discount: 10,
      discountType: "percentage",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      applyToOrderBumps: true,
      usageCount: 5,
    },
    {
      id: "2",
      code: "PROMO20",
      discount: 20,
      discountType: "percentage",
      startDate: null,
      endDate: null,
      applyToOrderBumps: false,
      usageCount: 0,
    },
  ];

  const defaultProps = {
    coupons: mockCoupons,
    onAdd: mockOnAdd,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders search input", () => {
      render(<CouponsTable {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/pesquisar/i);
      expect(searchInput).toBeInTheDocument();
    });

    it("renders add button", () => {
      render(<CouponsTable {...defaultProps} />);

      const addButton = screen.getByRole("button", { name: /adicionar cupom/i });
      expect(addButton).toBeInTheDocument();
    });

    it("renders table with coupons", () => {
      render(<CouponsTable {...defaultProps} />);

      expect(screen.getByText("DESCONTO10")).toBeInTheDocument();
      expect(screen.getByText("PROMO20")).toBeInTheDocument();
    });

    it("displays coupon codes", () => {
      render(<CouponsTable {...defaultProps} />);

      expect(screen.getByText("DESCONTO10")).toBeInTheDocument();
    });

    it("displays discount percentages", () => {
      render(<CouponsTable {...defaultProps} />);

      expect(screen.getByText("10%")).toBeInTheDocument();
      expect(screen.getByText("20%")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("filters coupons by code", async () => {
      const user = userEvent.setup();
      render(<CouponsTable {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/pesquisar/i);
      await user.type(searchInput, "DESCONTO");

      expect(screen.getByText("DESCONTO10")).toBeInTheDocument();
      expect(screen.queryByText("PROMO20")).not.toBeInTheDocument();
    });

    it("shows all coupons when search is empty", () => {
      render(<CouponsTable {...defaultProps} />);

      expect(screen.getByText("DESCONTO10")).toBeInTheDocument();
      expect(screen.getByText("PROMO20")).toBeInTheDocument();
    });

    it("search is case insensitive", async () => {
      const user = userEvent.setup();
      render(<CouponsTable {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/pesquisar/i);
      await user.type(searchInput, "desconto");

      expect(screen.getByText("DESCONTO10")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no coupons", () => {
      render(<CouponsTable {...defaultProps} coupons={[]} />);

      expect(screen.getByText(/nenhum registro encontrado/i)).toBeInTheDocument();
    });

    it("shows empty message when search has no results", async () => {
      const user = userEvent.setup();
      render(<CouponsTable {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/pesquisar/i);
      await user.type(searchInput, "INEXISTENTE");

      expect(screen.getByText(/nenhum registro encontrado/i)).toBeInTheDocument();
    });

    it("does not show table when empty", () => {
      render(<CouponsTable {...defaultProps} coupons={[]} />);

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("calls onAdd when add button is clicked", async () => {
      const user = userEvent.setup();
      render(<CouponsTable {...defaultProps} />);

      const addButton = screen.getByRole("button", { name: /adicionar cupom/i });
      await user.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe("Data Display", () => {
    it("displays usage count", () => {
      render(<CouponsTable {...defaultProps} />);

      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles null dates correctly", () => {
      render(<CouponsTable {...defaultProps} />);

      // Cupom sem datas deve renderizar sem erros
      expect(screen.getByText("PROMO20")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has accessible search input", () => {
      render(<CouponsTable {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/pesquisar/i);
      expect(searchInput).toBeInTheDocument();
    });

    it("add button is keyboard accessible", async () => {
      const user = userEvent.setup();
      render(<CouponsTable {...defaultProps} />);

      const addButton = screen.getByRole("button", { name: /adicionar cupom/i });
      addButton.focus();
      
      expect(addButton).toHaveFocus();
    });
  });
});
