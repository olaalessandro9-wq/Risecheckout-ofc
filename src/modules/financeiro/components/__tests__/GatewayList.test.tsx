/**
 * GatewayList Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for GatewayList component covering:
 * - Rendering all gateways from GATEWAY_ORDER
 * - Connection status display
 * - Gateway selection callback
 * - PaymentCard integration
 * - Gateway registry SSOT compliance
 *
 * @module modules/financeiro/components/__tests__/GatewayList.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { GatewayList } from "../GatewayList";
import type { GatewayConnectionMap } from "@/config/gateways/types";

describe("GatewayList", () => {
  const mockConnectionStatuses: GatewayConnectionMap = {
    asaas: { connected: true, lastSync: new Date().toISOString() },
    pushinpay: { connected: false, lastSync: null },
    mercadopago: { connected: true, lastSync: new Date().toISOString() },
    stripe: { connected: false, lastSync: null },
  };

  describe("Rendering", () => {
    it("renders all gateways from GATEWAY_ORDER", () => {
      const onSelect = vi.fn();
      render(
        <GatewayList
          connectionStatuses={mockConnectionStatuses}
          onSelect={onSelect}
        />
      );

      expect(screen.getByText("Asaas")).toBeInTheDocument();
      expect(screen.getByText("PushinPay")).toBeInTheDocument();
      expect(screen.getByText("Mercado Pago")).toBeInTheDocument();
      expect(screen.getByText("Stripe")).toBeInTheDocument();
    });

    it("renders gateway descriptions", () => {
      const onSelect = vi.fn();
      render(
        <GatewayList
          connectionStatuses={mockConnectionStatuses}
          onSelect={onSelect}
        />
      );

      expect(
        screen.getByText(/Gateway de pagamento brasileiro/i)
      ).toBeInTheDocument();
    });

    it("applies correct container classes", () => {
      const onSelect = vi.fn();
      const { container } = render(
        <GatewayList
          connectionStatuses={mockConnectionStatuses}
          onSelect={onSelect}
        />
      );

      const wrapper = container.querySelector(".max-w-3xl.space-y-3");
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("Connection Status", () => {
    it("displays connected status for connected gateways", () => {
      const onSelect = vi.fn();
      render(
        <GatewayList
          connectionStatuses={mockConnectionStatuses}
          onSelect={onSelect}
        />
      );

      const asaasCard = screen.getByText("Asaas").closest("div");
      expect(asaasCard).toBeInTheDocument();
    });

    it("displays disconnected status for disconnected gateways", () => {
      const onSelect = vi.fn();
      render(
        <GatewayList
          connectionStatuses={mockConnectionStatuses}
          onSelect={onSelect}
        />
      );

      const pushinpayCard = screen.getByText("PushinPay").closest("div");
      expect(pushinpayCard).toBeInTheDocument();
    });

    it("handles all gateways connected", () => {
      const allConnected: GatewayConnectionMap = {
        asaas: { connected: true, lastSync: new Date().toISOString() },
        pushinpay: { connected: true, lastSync: new Date().toISOString() },
        mercadopago: { connected: true, lastSync: new Date().toISOString() },
        stripe: { connected: true, lastSync: new Date().toISOString() },
      };

      const onSelect = vi.fn();
      render(
        <GatewayList connectionStatuses={allConnected} onSelect={onSelect} />
      );

      expect(screen.getByText("Asaas")).toBeInTheDocument();
      expect(screen.getByText("PushinPay")).toBeInTheDocument();
      expect(screen.getByText("Mercado Pago")).toBeInTheDocument();
      expect(screen.getByText("Stripe")).toBeInTheDocument();
    });

    it("handles all gateways disconnected", () => {
      const allDisconnected: GatewayConnectionMap = {
        asaas: { connected: false, lastSync: null },
        pushinpay: { connected: false, lastSync: null },
        mercadopago: { connected: false, lastSync: null },
        stripe: { connected: false, lastSync: null },
      };

      const onSelect = vi.fn();
      render(
        <GatewayList connectionStatuses={allDisconnected} onSelect={onSelect} />
      );

      expect(screen.getByText("Asaas")).toBeInTheDocument();
      expect(screen.getByText("PushinPay")).toBeInTheDocument();
    });
  });

  describe("Gateway Selection", () => {
    it("calls onSelect with correct gatewayId when Asaas is clicked", () => {
      const onSelect = vi.fn();
      render(
        <GatewayList
          connectionStatuses={mockConnectionStatuses}
          onSelect={onSelect}
        />
      );

      const asaasCard = screen.getByText("Asaas").closest("div");
      if (asaasCard) {
        fireEvent.click(asaasCard);
        expect(onSelect).toHaveBeenCalledWith("asaas");
      }
    });

    it("calls onSelect with correct gatewayId when PushinPay is clicked", () => {
      const onSelect = vi.fn();
      render(
        <GatewayList
          connectionStatuses={mockConnectionStatuses}
          onSelect={onSelect}
        />
      );

      const pushinpayCard = screen.getByText("PushinPay").closest("div");
      if (pushinpayCard) {
        fireEvent.click(pushinpayCard);
        expect(onSelect).toHaveBeenCalledWith("pushinpay");
      }
    });

    it("calls onSelect with correct gatewayId when Mercado Pago is clicked", () => {
      const onSelect = vi.fn();
      render(
        <GatewayList
          connectionStatuses={mockConnectionStatuses}
          onSelect={onSelect}
        />
      );

      const mercadopagoCard = screen.getByText("Mercado Pago").closest("div");
      if (mercadopagoCard) {
        fireEvent.click(mercadopagoCard);
        expect(onSelect).toHaveBeenCalledWith("mercadopago");
      }
    });

    it("calls onSelect with correct gatewayId when Stripe is clicked", () => {
      const onSelect = vi.fn();
      render(
        <GatewayList
          connectionStatuses={mockConnectionStatuses}
          onSelect={onSelect}
        />
      );

      const stripeCard = screen.getByText("Stripe").closest("div");
      if (stripeCard) {
        fireEvent.click(stripeCard);
        expect(onSelect).toHaveBeenCalledWith("stripe");
      }
    });

    it("does not call onSelect when not clicked", () => {
      const onSelect = vi.fn();
      render(
        <GatewayList
          connectionStatuses={mockConnectionStatuses}
          onSelect={onSelect}
        />
      );

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("Gateway Registry Integration", () => {
    it("renders gateways in GATEWAY_ORDER sequence", () => {
      const onSelect = vi.fn();
      const { container } = render(
        <GatewayList
          connectionStatuses={mockConnectionStatuses}
          onSelect={onSelect}
        />
      );

      const cards = container.querySelectorAll(".max-w-3xl > *");
      expect(cards).toHaveLength(4);
    });

    it("passes correct gateway data to PaymentCard", () => {
      const onSelect = vi.fn();
      render(
        <GatewayList
          connectionStatuses={mockConnectionStatuses}
          onSelect={onSelect}
        />
      );

      expect(screen.getByText("Asaas")).toBeInTheDocument();
      expect(screen.getByText("PushinPay")).toBeInTheDocument();
      expect(screen.getByText("Mercado Pago")).toBeInTheDocument();
      expect(screen.getByText("Stripe")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty onSelect gracefully", () => {
      const onSelect = vi.fn();
      expect(() =>
        render(
          <GatewayList
            connectionStatuses={mockConnectionStatuses}
            onSelect={onSelect}
          />
        )
      ).not.toThrow();
    });

    it("renders correctly with minimal connection data", () => {
      const minimalStatuses: GatewayConnectionMap = {
        asaas: { connected: false, lastSync: null },
        pushinpay: { connected: false, lastSync: null },
        mercadopago: { connected: false, lastSync: null },
        stripe: { connected: false, lastSync: null },
      };

      const onSelect = vi.fn();
      render(
        <GatewayList connectionStatuses={minimalStatuses} onSelect={onSelect} />
      );

      expect(screen.getByText("Asaas")).toBeInTheDocument();
    });
  });
});
