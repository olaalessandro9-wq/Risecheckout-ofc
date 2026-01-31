/**
 * @file CommissionDetails.test.tsx
 * @description Tests for CommissionDetails component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { CommissionDetails } from "../CommissionDetails";
import type { Offer } from "../hooks/useProductOffers";

// ============================================================================
// TEST DATA
// ============================================================================

const mockOfferOneTime: Offer = {
  id: "offer-001",
  name: "Oferta Única",
  price: 9700,
  type: "one_time",
  commissionValue: 2910,
};

const mockOfferRecurring: Offer = {
  id: "offer-002",
  name: "Oferta Recorrente",
  price: 4700,
  type: "recurring",
  commissionValue: 1410,
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe("CommissionDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render commission percentage for one-time offers", () => {
      render(
        <CommissionDetails
          commissionPercentage={30}
          hasOrderBumpCommission={false}
          offers={[mockOfferOneTime]}
        />
      );

      expect(screen.getByText("Detalhes da Comissão")).toBeInTheDocument();
      expect(screen.getByText("30% em ofertas de preço único")).toBeInTheDocument();
    });

    it("should render commission for recurring offers when present", () => {
      render(
        <CommissionDetails
          commissionPercentage={30}
          hasOrderBumpCommission={false}
          offers={[mockOfferOneTime, mockOfferRecurring]}
        />
      );

      expect(screen.getByText("30% em ofertas de preço único")).toBeInTheDocument();
      expect(screen.getByText("30% em ofertas recorrentes")).toBeInTheDocument();
    });

    it("should not render recurring commission when no recurring offers", () => {
      render(
        <CommissionDetails
          commissionPercentage={30}
          hasOrderBumpCommission={false}
          offers={[mockOfferOneTime]}
        />
      );

      expect(screen.getByText("30% em ofertas de preço único")).toBeInTheDocument();
      expect(screen.queryByText("30% em ofertas recorrentes")).not.toBeInTheDocument();
    });

    it("should render order bump commission info when hasOrderBumpCommission is true", () => {
      render(
        <CommissionDetails
          commissionPercentage={30}
          hasOrderBumpCommission={true}
          offers={[mockOfferOneTime]}
        />
      );

      expect(
        screen.getByText("Comissão também em Order Bumps e Upsells")
      ).toBeInTheDocument();
    });

    it("should not render order bump commission info when hasOrderBumpCommission is false", () => {
      render(
        <CommissionDetails
          commissionPercentage={30}
          hasOrderBumpCommission={false}
          offers={[mockOfferOneTime]}
        />
      );

      expect(
        screen.queryByText("Comissão também em Order Bumps e Upsells")
      ).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null commissionPercentage by showing 0%", () => {
      render(
        <CommissionDetails
          commissionPercentage={null}
          hasOrderBumpCommission={false}
          offers={[mockOfferOneTime]}
        />
      );

      expect(screen.getByText("0% em ofertas de preço único")).toBeInTheDocument();
    });

    it("should handle null hasOrderBumpCommission gracefully", () => {
      render(
        <CommissionDetails
          commissionPercentage={30}
          hasOrderBumpCommission={null}
          offers={[mockOfferOneTime]}
        />
      );

      // Should not render order bump info when null (falsy)
      expect(
        screen.queryByText("Comissão também em Order Bumps e Upsells")
      ).not.toBeInTheDocument();
    });

    it("should handle empty offers array", () => {
      render(
        <CommissionDetails
          commissionPercentage={30}
          hasOrderBumpCommission={false}
          offers={[]}
        />
      );

      expect(screen.getByText("Detalhes da Comissão")).toBeInTheDocument();
      expect(screen.getByText("30% em ofertas de preço único")).toBeInTheDocument();
      expect(screen.queryByText("30% em ofertas recorrentes")).not.toBeInTheDocument();
    });

    it("should render all commission types when all conditions are met", () => {
      render(
        <CommissionDetails
          commissionPercentage={50}
          hasOrderBumpCommission={true}
          offers={[mockOfferOneTime, mockOfferRecurring]}
        />
      );

      expect(screen.getByText("50% em ofertas de preço único")).toBeInTheDocument();
      expect(screen.getByText("50% em ofertas recorrentes")).toBeInTheDocument();
      expect(
        screen.getByText("Comissão também em Order Bumps e Upsells")
      ).toBeInTheDocument();
    });
  });
});
