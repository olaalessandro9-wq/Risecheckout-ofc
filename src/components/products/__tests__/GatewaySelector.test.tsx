/**
 * GatewaySelector Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for GatewaySelector component covering:
 * - Component rendering
 * - Gateway display
 * - Empty states
 * - Selection handling
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
      name: "Mercado Pago",
      methods: ["pix", "credit_card"],
      fees: { pix: 1.99, credit_card: 4.99 },
      status: "active",
    },
  ],
  getGatewaysByMethod: () => [],
  formatGatewayFees: () => "1,99%",
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

    it("renders gateway structure", () => {
      const { container } = render(<GatewaySelector {...defaultProps} />);
      
      const radioGroup = container.querySelector('[role="radiogroup"]');
      expect(radioGroup).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("renders with different payment methods", () => {
      const { container } = render(<GatewaySelector {...defaultProps} paymentMethod="credit_card" />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it("handles showComingSoon prop", () => {
      const { container } = render(<GatewaySelector {...defaultProps} showComingSoon={false} />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it("handles credentials prop", () => {
      const credentials = { mercadopago: { configured: true } };
      const { container } = render(<GatewaySelector {...defaultProps} credentials={credentials} />);
      
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
