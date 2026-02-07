/**
 * GatewaySelector Component Tests
 * 
 * Tests for the redesigned GatewaySelector with compact card layout.
 * 
 * @module components/products/__tests__/GatewaySelector.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { GatewaySelector } from "../GatewaySelector";

// Mock hooks
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ role: "owner" }),
}));

// Mock config
vi.mock("@/config/payment-gateways", () => ({
  getActiveGatewaysByMethod: () => [
    {
      id: "mercadopago",
      displayName: "Mercado Pago",
      name: "Mercado Pago",
      methods: ["pix", "credit_card"],
      supportedMethods: ["pix", "credit_card"],
      fees: { pix: { percentage: 1.99 }, credit_card: { percentage: 4.99 } },
      status: "active",
      requiresCredentials: true,
    },
  ],
  getGatewaysByMethod: () => [],
}));

describe("GatewaySelector", () => {
  const mockOnChange = vi.fn();

  const defaultProps = {
    paymentMethod: "pix" as const,
    value: "",
    onChange: mockOnChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(<GatewaySelector {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders gateway card with radiogroup role", () => {
      const { container } = render(<GatewaySelector {...defaultProps} />);
      const radioGroup = container.querySelector('[role="radiogroup"]');
      expect(radioGroup).toBeInTheDocument();
    });

    it("renders gateway card as radio button", () => {
      const { container } = render(<GatewaySelector {...defaultProps} />);
      const radioButton = container.querySelector('[role="radio"]');
      expect(radioButton).toBeInTheDocument();
    });

    it("displays gateway name", () => {
      render(<GatewaySelector {...defaultProps} />);
      expect(screen.getByText("Mercado Pago")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("renders with different payment methods", () => {
      const { container } = render(
        <GatewaySelector {...defaultProps} paymentMethod="credit_card" />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("handles showComingSoon prop", () => {
      const { container } = render(
        <GatewaySelector {...defaultProps} showComingSoon={false} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("handles credentials prop", () => {
      const credentials = { mercadopago: { configured: true } };
      const { container } = render(
        <GatewaySelector {...defaultProps} credentials={credentials} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("marks selected gateway with aria-checked", () => {
      const { container } = render(
        <GatewaySelector {...defaultProps} value="mercadopago" />
      );
      const radio = container.querySelector('[role="radio"][aria-checked="true"]');
      expect(radio).toBeInTheDocument();
    });
  });
});
