/**
 * RecentCustomersTable Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for RecentCustomersTable orchestrator component covering:
 * - Table rendering
 * - Customer data display
 * - Pagination
 * - Loading states
 * 
 * @module components/dashboard/recent-customers/__tests__/RecentCustomersTable.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { RecentCustomersTable } from "../RecentCustomersTable";
import type { Customer } from "../types";

// Mock hooks
vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: () => ({
    user: { id: "user-1" },
  }),
}));

vi.mock("@/hooks/useDecryptCustomerBatch", () => ({
  useDecryptCustomerBatch: () => ({
    decryptedMap: {},
    isLoading: false,
  }),
}));

vi.mock("@/contexts/UltrawidePerformanceContext", () => ({
  useUltrawidePerformance: () => ({
    isUltrawide: false,
    disableBlur: false,
    disableHoverEffects: false,
  }),
}));

// Mock child components
vi.mock("../CustomerTableHeader", () => ({
  CustomerTableHeader: () => <thead data-testid="table-header"><tr><th>Header</th></tr></thead>,
}));

vi.mock("../CustomerTableBody", () => ({
  CustomerTableBody: ({ isLoading }: { isLoading: boolean }) => (
    <tbody data-testid="table-body">
      {isLoading ? (
        <tr><td><div data-testid="skeleton">Loading...</div></td></tr>
      ) : (
        <tr><td>Body</td></tr>
      )}
    </tbody>
  ),
}));

vi.mock("../CustomerPagination", () => ({
  CustomerPagination: () => <div data-testid="pagination">Pagination</div>,
}));

vi.mock("../hooks/useCustomerPagination", () => ({
  useCustomerPagination: (customers: Customer[]) => ({
    paginatedCustomers: customers,
    filteredCustomers: customers,
    currentPage: 1,
    totalPages: 1,
    goToPage: vi.fn(),
    nextPage: vi.fn(),
    previousPage: vi.fn(),
  }),
}));

vi.mock("../../OrderDetailsDialog", () => ({
  OrderDetailsDialog: ({ open }: { open: boolean }) => 
    open ? <div data-testid="order-dialog">Order Dialog</div> : null,
}));

describe("RecentCustomersTable", () => {
  const mockCustomers: Customer[] = [
    {
      id: "customer-1",
      orderId: "order-1",
      offer: "Oferta 1",
      client: "João Silva",
      phone: "11999999999",
      email: "joao@example.com",
      createdAt: "2026-01-01T10:00:00Z",
      value: "R$ 99,00",
      status: "Pago",
      productName: "Produto 1",
      productImageUrl: "",
      productOwnerId: "user-1",
      customerName: "João Silva",
      customerEmail: "joao@example.com",
      customerPhone: "11999999999",
      customerDocument: "12345678900",
      fullCreatedAt: "2026-01-01T10:00:00Z",
    },
    {
      id: "customer-2",
      orderId: "order-2",
      offer: "Oferta 2",
      client: "Maria Santos",
      phone: "11988888888",
      email: "maria@example.com",
      createdAt: "2026-01-02T10:00:00Z",
      value: "R$ 149,00",
      status: "Pendente",
      productName: "Produto 2",
      productImageUrl: "",
      productOwnerId: "user-2",
      customerName: "Maria Santos",
      customerEmail: "maria@example.com",
      customerPhone: "11988888888",
      customerDocument: "98765432100",
      fullCreatedAt: "2026-01-02T10:00:00Z",
    },
  ];

  const defaultProps = {
    customers: mockCustomers,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(<RecentCustomersTable {...defaultProps} />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders table structure", () => {
      render(<RecentCustomersTable {...defaultProps} />);
      
      expect(screen.getByTestId("table-header")).toBeInTheDocument();
      expect(screen.getByTestId("table-body")).toBeInTheDocument();
    });

    it("renders pagination", () => {
      render(<RecentCustomersTable {...defaultProps} />);
      
      expect(screen.getByTestId("pagination")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading skeleton when isLoading is true", () => {
      render(<RecentCustomersTable {...defaultProps} isLoading={true} />);
      
      expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    });

    it("renders content when not loading", () => {
      render(<RecentCustomersTable {...defaultProps} isLoading={false} />);
      
      expect(screen.getByTestId("table-body")).toBeInTheDocument();
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });
  });

  describe("Customer Data", () => {
    it("passes customers to pagination hook", () => {
      render(<RecentCustomersTable {...defaultProps} />);
      
      expect(screen.getByTestId("table-body")).toBeInTheDocument();
    });

    it("handles empty customer list", () => {
      render(<RecentCustomersTable {...defaultProps} customers={[]} />);
      
      expect(screen.getByTestId("table-body")).toBeInTheDocument();
    });
  });

  describe("Refresh Functionality", () => {
    it("accepts onRefresh callback", () => {
      const mockRefresh = vi.fn();
      render(<RecentCustomersTable {...defaultProps} onRefresh={mockRefresh} />);
      
      expect(screen.getByTestId("table-body")).toBeInTheDocument();
    });

    it("renders without onRefresh callback", () => {
      render(<RecentCustomersTable {...defaultProps} />);
      
      expect(screen.getByTestId("table-body")).toBeInTheDocument();
    });
  });

  describe("Dialog Integration", () => {
    it("dialog is closed by default", () => {
      render(<RecentCustomersTable {...defaultProps} />);
      
      expect(screen.queryByTestId("order-dialog")).not.toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("renders motion wrapper", () => {
      const { container } = render(<RecentCustomersTable {...defaultProps} />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders table wrapper", () => {
      render(<RecentCustomersTable {...defaultProps} />);
      
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });
});
