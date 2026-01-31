/**
 * @file CommissionDetails.test.tsx
 * @description Tests for CommissionDetails component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@/test/utils";
import { CommissionDetails } from "../CommissionDetails";
import type { Offer } from "../hooks/useProductOffers";

// ============================================================================
// TEST DATA - Using correct Offer interface
// ============================================================================

const mockOfferOneTime: Offer = {
  id: "offer-001",
  name: "Oferta Única",
  price: 9700,
  type: "one_time",
  commission: 2910,
  checkoutUrl: "https://example.com/checkout/offer-001",
};

const mockOfferRecurring: Offer = {
  id: "offer-002",
  name: "Oferta Recorrente",
  price: 4700,
  type: "recurring",
  commission: 1410,
  checkoutUrl: "https://example.com/checkout/offer-002",
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe("CommissionDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing with one-time offers", () => {
      expect(() =>
        render(
          <CommissionDetails
            commissionPercentage={30}
            hasOrderBumpCommission={false}
            offers={[mockOfferOneTime]}
          />
        )
      ).not.toThrow();
    });

    it("should render without crashing with recurring offers", () => {
      expect(() =>
        render(
          <CommissionDetails
            commissionPercentage={30}
            hasOrderBumpCommission={false}
            offers={[mockOfferOneTime, mockOfferRecurring]}
          />
        )
      ).not.toThrow();
    });

    it("should render without crashing with order bump commission", () => {
      expect(() =>
        render(
          <CommissionDetails
            commissionPercentage={30}
            hasOrderBumpCommission={true}
            offers={[mockOfferOneTime]}
          />
        )
      ).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null commissionPercentage", () => {
      expect(() =>
        render(
          <CommissionDetails
            commissionPercentage={null}
            hasOrderBumpCommission={false}
            offers={[mockOfferOneTime]}
          />
        )
      ).not.toThrow();
    });

    it("should handle null hasOrderBumpCommission", () => {
      expect(() =>
        render(
          <CommissionDetails
            commissionPercentage={30}
            hasOrderBumpCommission={null}
            offers={[mockOfferOneTime]}
          />
        )
      ).not.toThrow();
    });

    it("should handle empty offers array", () => {
      expect(() =>
        render(
          <CommissionDetails
            commissionPercentage={30}
            hasOrderBumpCommission={false}
            offers={[]}
          />
        )
      ).not.toThrow();
    });
  });
});
