/**
 * @file OfferCard.test.tsx
 * @description Tests for OfferCard component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@/test/utils";
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
  price: 29700,
  type: "one_time",
  commission: 8910,
  commissionValue: 8910,
};

const mockOfferRecurring: Offer = {
  id: "offer-002",
  name: "Assinatura Mensal",
  price: 9700,
  type: "recurring",
  commission: 2910,
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
    it("should render without crashing with one-time offer", () => {
      expect(() => render(<OfferCard offer={mockOfferOneTime} />)).not.toThrow();
    });

    it("should render without crashing with recurring offer", () => {
      expect(() => render(<OfferCard offer={mockOfferRecurring} />)).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero price", () => {
      const offerWithZeroPrice: Offer = {
        ...mockOfferOneTime,
        price: 0,
        commission: 0,
      };

      expect(() => render(<OfferCard offer={offerWithZeroPrice} />)).not.toThrow();
    });

    it("should handle very large values", () => {
      const offerWithLargePrice: Offer = {
        ...mockOfferOneTime,
        price: 999900,
        commission: 299970,
      };

      expect(() => render(<OfferCard offer={offerWithLargePrice} />)).not.toThrow();
    });

    it("should handle empty offer name", () => {
      const offerWithEmptyName: Offer = {
        ...mockOfferOneTime,
        name: "",
      };

      expect(() => render(<OfferCard offer={offerWithEmptyName} />)).not.toThrow();
    });
  });
});
