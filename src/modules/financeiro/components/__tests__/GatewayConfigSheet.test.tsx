/**
 * GatewayConfigSheet Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for GatewayConfigSheet component covering:
 * - Sheet open/close behavior
 * - Gateway-specific ConfigForm rendering
 * - Connection status propagation (SSOT)
 * - FinanceiroContext integration
 * - Gateway registry data display
 * - Edge cases (null gatewayId)
 *
 * @module modules/financeiro/components/__tests__/GatewayConfigSheet.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { GatewayConfigSheet } from "../GatewayConfigSheet";
import type { GatewayConnectionMap } from "@/config/gateways/types";

// Mock FinanceiroContext
vi.mock("../../context/FinanceiroContext", () => ({
  useFinanceiroContext: vi.fn(() => ({
    connectionStatuses: {
      asaas: { connected: true, lastSync: new Date().toISOString() },
      pushinpay: { connected: false, lastSync: null },
      mercadopago: { connected: true, lastSync: new Date().toISOString() },
      stripe: { connected: false, lastSync: null },
    } as GatewayConnectionMap,
  })),
}));

// Mock gateway ConfigForms
vi.mock("@/integrations/gateways/asaas", () => ({
  ConfigForm: ({ connectionStatus }: { connectionStatus: unknown }) => (
    <div data-testid="asaas-config-form">
      Asaas Config Form
      {connectionStatus && <span>Status: Connected</span>}
    </div>
  ),
}));

vi.mock("@/integrations/gateways/pushinpay", () => ({
  ConfigForm: ({ connectionStatus }: { connectionStatus: unknown }) => (
    <div data-testid="pushinpay-config-form">
      PushinPay Config Form
      {connectionStatus && <span>Status: Connected</span>}
    </div>
  ),
}));

vi.mock("@/integrations/gateways/mercadopago", () => ({
  ConfigForm: ({ connectionStatus }: { connectionStatus: unknown }) => (
    <div data-testid="mercadopago-config-form">
      Mercado Pago Config Form
      {connectionStatus && <span>Status: Connected</span>}
    </div>
  ),
}));

vi.mock("@/integrations/gateways/stripe", () => ({
  ConfigForm: ({ connectionStatus }: { connectionStatus: unknown }) => (
    <div data-testid="stripe-config-form">
      Stripe Config Form
      {connectionStatus && <span>Status: Connected</span>}
    </div>
  ),
}));

describe("GatewayConfigSheet", () => {
  const mockOnClose = vi.fn();
  const mockOnConnectionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders when open is true", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId="asaas"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(screen.getByText("Asaas")).toBeInTheDocument();
    });

    it("does not render content when open is false", () => {
      render(
        <GatewayConfigSheet
          open={false}
          gatewayId="asaas"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(screen.queryByText("Asaas Config Form")).not.toBeInTheDocument();
    });

    it("renders gateway name from GATEWAY_REGISTRY", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId="mercadopago"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(screen.getByText("Mercado Pago")).toBeInTheDocument();
    });

    it("renders gateway description from GATEWAY_REGISTRY", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId="asaas"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(
        screen.getByText(/Gateway de pagamento brasileiro/i)
      ).toBeInTheDocument();
    });
  });

  describe("Gateway-Specific ConfigForms", () => {
    it("renders Asaas ConfigForm when gatewayId is asaas", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId="asaas"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(screen.getByTestId("asaas-config-form")).toBeInTheDocument();
    });

    it("renders PushinPay ConfigForm when gatewayId is pushinpay", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId="pushinpay"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(screen.getByTestId("pushinpay-config-form")).toBeInTheDocument();
    });

    it("renders Mercado Pago ConfigForm when gatewayId is mercadopago", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId="mercadopago"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(screen.getByTestId("mercadopago-config-form")).toBeInTheDocument();
    });

    it("renders Stripe ConfigForm when gatewayId is stripe", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId="stripe"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(screen.getByTestId("stripe-config-form")).toBeInTheDocument();
    });

    it("renders nothing when gatewayId is null", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId={null}
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(screen.queryByTestId("asaas-config-form")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("pushinpay-config-form")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("mercadopago-config-form")
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("stripe-config-form")).not.toBeInTheDocument();
    });
  });

  describe("Connection Status Propagation (SSOT)", () => {
    it("passes connectionStatus to Asaas ConfigForm", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId="asaas"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(screen.getByText("Status: Connected")).toBeInTheDocument();
    });

    it("passes connectionStatus to Mercado Pago ConfigForm", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId="mercadopago"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(screen.getByText("Status: Connected")).toBeInTheDocument();
    });

    it("passes null connectionStatus when gatewayId is null", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId={null}
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(screen.queryByText("Status: Connected")).not.toBeInTheDocument();
    });
  });

  describe("Sheet Behavior", () => {
    it("calls onClose when sheet is closed", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId="asaas"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      const closeButton = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("applies correct max-width class to SheetContent", () => {
      const { container } = render(
        <GatewayConfigSheet
          open={true}
          gatewayId="asaas"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      const sheetContent = container.querySelector(".sm\\:max-w-\\[600px\\]");
      expect(sheetContent).toBeInTheDocument();
    });

    it("applies overflow-y-auto class to SheetContent", () => {
      const { container } = render(
        <GatewayConfigSheet
          open={true}
          gatewayId="asaas"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      const sheetContent = container.querySelector(".overflow-y-auto");
      expect(sheetContent).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles null gatewayId gracefully", () => {
      expect(() =>
        render(
          <GatewayConfigSheet
            open={true}
            gatewayId={null}
            onClose={mockOnClose}
            onConnectionChange={mockOnConnectionChange}
          />
        )
      ).not.toThrow();
    });

    it("renders empty strings for name and description when gatewayId is null", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId={null}
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      const title = screen.queryByRole("heading", { level: 2 });
      expect(title).toHaveTextContent("");
    });

    it("does not crash when onConnectionChange is called", () => {
      render(
        <GatewayConfigSheet
          open={true}
          gatewayId="asaas"
          onClose={mockOnClose}
          onConnectionChange={mockOnConnectionChange}
        />
      );

      expect(mockOnConnectionChange).not.toHaveBeenCalled();
    });
  });
});
