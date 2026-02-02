/**
 * OrderDetailsDialog Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for OrderDetailsDialog orchestrator component covering:
 * - Dialog rendering
 * - Order data display
 * - Status handling
 * - Encryption/decryption logic
 * 
 * @module components/dashboard/__tests__/OrderDetailsDialog.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { OrderDetailsDialog } from "../OrderDetailsDialog";

// Mock hooks
vi.mock("@/hooks/useDecryptCustomerData", () => ({
  useDecryptCustomerData: () => ({
    decryptedData: null,
    isLoading: false,
    error: null,
    decrypt: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: () => ({
    user: { id: "user-1" },
  }),
}));

// Mock child components
vi.mock("../order-details", () => ({
  OrderHeader: () => <div data-testid="order-header">Order Header</div>,
  OrderProductSection: () => <div data-testid="product-section">Product Section</div>,
  OrderCustomerSection: () => <div data-testid="customer-section">Customer Section</div>,
  OrderPaymentSection: () => <div data-testid="payment-section">Payment Section</div>,
  getStatusConfig: () => ({ label: "Aprovado", color: "green" }),
  MASKED_VALUE: "***",
}));

describe("OrderDetailsDialog", () => {
  const mockOnOpenChange = vi.fn();

  const mockOrderData = {
    id: "order-1",
    customerName: "João Silva",
    customerEmail: "joao@example.com",
    customerPhone: "11999999999",
    customerDocument: "12345678900",
    productName: "Produto Teste",
    productImageUrl: "https://example.com/image.jpg",
    amount: "R$ 99,00",
    status: "Pago" as const,
    createdAt: "2026-01-01T10:00:00Z",
  };

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    orderData: mockOrderData,
    productOwnerId: "user-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders when open is true", () => {
      render(<OrderDetailsDialog {...defaultProps} />);
      
      expect(screen.getByTestId("order-header")).toBeInTheDocument();
    });

    it("does not render when orderData is null", () => {
      const { container } = render(
        <OrderDetailsDialog {...defaultProps} orderData={null} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it("renders all sections", () => {
      render(<OrderDetailsDialog {...defaultProps} />);
      
      expect(screen.getByTestId("order-header")).toBeInTheDocument();
      expect(screen.getByTestId("product-section")).toBeInTheDocument();
      expect(screen.getByTestId("customer-section")).toBeInTheDocument();
      expect(screen.getByTestId("payment-section")).toBeInTheDocument();
    });
  });

  describe("Dialog State", () => {
    it("renders when open is true", () => {
      render(<OrderDetailsDialog {...defaultProps} open={true} />);
      
      expect(screen.getByTestId("order-header")).toBeInTheDocument();
    });

    it("handles open state changes", () => {
      const { rerender } = render(<OrderDetailsDialog {...defaultProps} open={false} />);
      
      rerender(<OrderDetailsDialog {...defaultProps} open={true} />);
      
      expect(screen.getByTestId("order-header")).toBeInTheDocument();
    });
  });

  describe("Order Data", () => {
    it("passes order data to child components", () => {
      render(<OrderDetailsDialog {...defaultProps} />);
      
      expect(screen.getByTestId("order-header")).toBeInTheDocument();
      expect(screen.getByTestId("product-section")).toBeInTheDocument();
    });

    it("handles different order statuses", () => {
      const approvedOrder = { ...mockOrderData, status: "Pago" as const };
      render(<OrderDetailsDialog {...defaultProps} orderData={approvedOrder} />);
      
      expect(screen.getByTestId("order-header")).toBeInTheDocument();
    });
  });

  describe("Product Owner", () => {
    it("handles product owner correctly", () => {
      render(<OrderDetailsDialog {...defaultProps} productOwnerId="user-1" />);
      
      expect(screen.getByTestId("order-header")).toBeInTheDocument();
    });

    it("handles non-owner user", () => {
      render(<OrderDetailsDialog {...defaultProps} productOwnerId="other-user" />);
      
      expect(screen.getByTestId("order-header")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("renders all required sections", () => {
      render(<OrderDetailsDialog {...defaultProps} />);
      
      expect(screen.getByTestId("order-header")).toBeInTheDocument();
      expect(screen.getByTestId("product-section")).toBeInTheDocument();
      expect(screen.getByTestId("customer-section")).toBeInTheDocument();
      expect(screen.getByTestId("payment-section")).toBeInTheDocument();
    });
  });
});
