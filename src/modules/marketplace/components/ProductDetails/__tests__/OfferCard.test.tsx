/**
 * @file OfferCard.test.tsx
 * @description Tests for OfferCard component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { OfferCard } from "../OfferCard";
import type { Offer } from "../hooks/useProductOffers";

// Mock utils
vi.mock("../utils", () => ({
  formatPrice: (value: number) => `R$ ${(value / 100).toFixed(2)}`,
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockOfferOneTime: Offer = {
  id: "offer-001",
  name: "Oferta Principal",
  price: 29700, // R$ 297,00
  type: "one_time",
  commission: 8910, // R$ 89,10
  commissionValue: 8910,
};

const mockOfferRecurring: Offer = {
  id: "offer-002",
  name: "Assinatura Mensal",
  price: 9700, // R$ 97,00
  type: "recurring",
  commission: 2910, // R$ 29,10
  commissionValue: 2910,
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe("OfferCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render offer name", () => {
      render(<OfferCard offer={mockOfferOneTime} />);

      expect(screen.getByText("Oferta Principal")).toBeInTheDocument();
    });

    it("should render offer price", () => {
      render(<OfferCard offer={mockOfferOneTime} />);

      expect(screen.getByText("Valor")).toBeInTheDocument();
      expect(screen.getByText("R$ 297.00")).toBeInTheDocument();
    });

    it("should render commission value", () => {
      render(<OfferCard offer={mockOfferOneTime} />);

      expect(screen.getByText("Você recebe")).toBeInTheDocument();
      expect(screen.getByText("R$ 89.10")).toBeInTheDocument();
    });

    it("should render recurring badge for recurring offers", () => {
      render(<OfferCard offer={mockOfferRecurring} />);

      expect(screen.getByText("Recorrente")).toBeInTheDocument();
    });

    it("should not render recurring badge for one-time offers", () => {
      render(<OfferCard offer={mockOfferOneTime} />);

      expect(screen.queryByText("Recorrente")).not.toBeInTheDocument();
    });
  });

  describe("Different Offer Types", () => {
    it("should render one-time offer correctly", () => {
      render(<OfferCard offer={mockOfferOneTime} />);

      expect(screen.getByText("Oferta Principal")).toBeInTheDocument();
      expect(screen.getByText("R$ 297.00")).toBeInTheDocument();
      expect(screen.getByText("R$ 89.10")).toBeInTheDocument();
      expect(screen.queryByText("Recorrente")).not.toBeInTheDocument();
    });

    it("should render recurring offer correctly", () => {
      render(<OfferCard offer={mockOfferRecurring} />);

      expect(screen.getByText("Assinatura Mensal")).toBeInTheDocument();
      expect(screen.getByText("R$ 97.00")).toBeInTheDocument();
      expect(screen.getByText("R$ 29.10")).toBeInTheDocument();
      expect(screen.getByText("Recorrente")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero price", () => {
      const offerWithZeroPrice: Offer = {
        ...mockOfferOneTime,
        price: 0,
        commission: 0,
      };

      render(<OfferCard offer={offerWithZeroPrice} />);

      expect(screen.getByText("R$ 0.00")).toBeInTheDocument();
    });

    it("should handle very large values", () => {
      const offerWithLargePrice: Offer = {
        ...mockOfferOneTime,
        price: 999900, // R$ 9.999,00
        commission: 299970, // R$ 2.999,70
      };

      render(<OfferCard offer={offerWithLargePrice} />);

      expect(screen.getByText("R$ 9999.00")).toBeInTheDocument();
      expect(screen.getByText("R$ 2999.70")).toBeInTheDocument();
    });

    it("should handle empty offer name", () => {
      const offerWithEmptyName: Offer = {
        ...mockOfferOneTime,
        name: "",
      };

      render(<OfferCard offer={offerWithEmptyName} />);

      // Should render without crashing
      expect(screen.getByText("Valor")).toBeInTheDocument();
    });
  });
});
