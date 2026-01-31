/**
 * @file ConnectionStatus.test.tsx
 * @description Tests for Asaas ConnectionStatus component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectionStatus } from "../../components/ConnectionStatus";

describe("Asaas ConnectionStatus", () => {
  describe("Connected State", () => {
    it("should show connected message when connected", () => {
      render(<ConnectionStatus isConnected={true} />);

      expect(screen.getByText(/conectado/i)).toBeInTheDocument();
    });

    it("should show check icon when connected", () => {
      render(<ConnectionStatus isConnected={true} />);

      // Check for the CheckCircle2 icon presence
      const container = screen.getByText(/conectado/i).parentElement;
      expect(container).toBeInTheDocument();

      // Should have SVG icon
      const svg = container?.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should use green color for connected state", () => {
      render(<ConnectionStatus isConnected={true} />);

      const element = screen.getByText(/conectado/i).parentElement;
      expect(element).toHaveClass(/green/);
    });

    it("should show 'ativo' in the message", () => {
      render(<ConnectionStatus isConnected={true} />);

      expect(screen.getByText(/ativo/i)).toBeInTheDocument();
    });
  });

  describe("Disconnected State", () => {
    it("should render nothing when disconnected", () => {
      const { container } = render(<ConnectionStatus isConnected={false} />);

      expect(container.firstChild).toBeNull();
    });

    it("should not show any message when disconnected", () => {
      render(<ConnectionStatus isConnected={false} />);

      expect(screen.queryByText(/conectado/i)).not.toBeInTheDocument();
    });
  });

  describe("Rendering", () => {
    it("should render as flex container when connected", () => {
      render(<ConnectionStatus isConnected={true} />);

      const element = screen.getByText(/conectado/i).parentElement;
      expect(element).toHaveClass("flex");
    });

    it("should have proper spacing between icon and text", () => {
      render(<ConnectionStatus isConnected={true} />);

      const element = screen.getByText(/conectado/i).parentElement;
      expect(element).toHaveClass("gap-2");
    });

    it("should have text-sm class for small text", () => {
      render(<ConnectionStatus isConnected={true} />);

      const element = screen.getByText(/conectado/i).parentElement;
      expect(element).toHaveClass("text-sm");
    });
  });

  describe("Accessibility", () => {
    it("should be accessible with screen readers", () => {
      render(<ConnectionStatus isConnected={true} />);

      // The text should be readable
      const text = screen.getByText(/asaas conectado e ativo/i);
      expect(text).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined isConnected", () => {
      const { container } = render(<ConnectionStatus isConnected={undefined as unknown as boolean} />);

      expect(container.firstChild).toBeNull();
    });

    it("should handle null isConnected", () => {
      const { container } = render(<ConnectionStatus isConnected={null as unknown as boolean} />);

      expect(container.firstChild).toBeNull();
    });
  });
});
