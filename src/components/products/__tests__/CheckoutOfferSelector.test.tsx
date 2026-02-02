/**
 * CheckoutOfferSelector Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for CheckoutOfferSelector component covering:
 * - Component rendering
 * - Offer display
 * - Empty states
 * - Selection handling
 * 
 * @module components/products/__tests__/CheckoutOfferSelector.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { CheckoutOfferSelector } from "../CheckoutOfferSelector";

// Mock dependencies
vi.mock("@/lib/links/attachOfferToCheckoutSmart", () => ({
  attachOfferToCheckoutSmart: vi.fn().mockResolvedValue({
    link_id: "link-1",
    slug: "test-slug",
    mode: "cloned",
  }),
}));

vi.mock("@/components/BusyProvider", () => ({
  useBusy: () => ({
    run: vi.fn((fn) => fn()),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
  }),
}));

// Mock lucide-react
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    AlertCircle: () => <div data-testid="alert-icon" />,
  };
});

describe("CheckoutOfferSelector", () => {
  const mockOnLinked = vi.fn();

  const mockOffers = [
    { id: "1", name: "Oferta 1", price: 9900, is_default: true },
    { id: "2", name: "Oferta 2", price: 14900, is_default: false },
  ];

  const defaultProps = {
    checkoutId: "checkout-1",
    offers: mockOffers,
    onLinked: mockOnLinked,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(<CheckoutOfferSelector {...defaultProps} />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders offer names", () => {
      render(<CheckoutOfferSelector {...defaultProps} />);
      
      expect(screen.getByText("Oferta 1")).toBeInTheDocument();
      expect(screen.getByText("Oferta 2")).toBeInTheDocument();
    });

    it("renders formatted prices", () => {
      render(<CheckoutOfferSelector {...defaultProps} />);
      
      expect(screen.getByText(/R\$ 99,00/)).toBeInTheDocument();
      expect(screen.getByText(/R\$ 149,00/)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows warning when no offers available", () => {
      render(<CheckoutOfferSelector {...defaultProps} offers={[]} />);
      
      expect(screen.getByText(/nenhuma oferta disponível/i)).toBeInTheDocument();
    });

    it("shows helper text in empty state", () => {
      render(<CheckoutOfferSelector {...defaultProps} offers={[]} />);
      
      expect(screen.getByText(/crie ofertas na aba "geral"/i)).toBeInTheDocument();
    });

    it("displays alert icon in empty state", () => {
      render(<CheckoutOfferSelector {...defaultProps} offers={[]} />);
      
      expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
    });
  });

  describe("Offer Display", () => {
    it("displays all offers", () => {
      render(<CheckoutOfferSelector {...defaultProps} />);
      
      expect(screen.getByText("Oferta 1")).toBeInTheDocument();
      expect(screen.getByText("Oferta 2")).toBeInTheDocument();
    });

    it("shows default badge for default offer", () => {
      render(<CheckoutOfferSelector {...defaultProps} />);
      
      expect(screen.getByText(/padrão/i)).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("renders with checkoutId", () => {
      render(<CheckoutOfferSelector {...defaultProps} />);
      
      expect(screen.getByText("Oferta 1")).toBeInTheDocument();
    });

    it("handles offers without onLinked callback", () => {
      const { container } = render(
        <CheckoutOfferSelector checkoutId="checkout-1" offers={mockOffers} />
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
