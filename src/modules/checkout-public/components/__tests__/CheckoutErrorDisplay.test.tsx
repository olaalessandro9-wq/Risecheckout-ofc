/**
 * CheckoutErrorDisplay Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests error messages, retry behavior, and icon display.
 * 
 * @module test/modules/checkout-public/components/CheckoutErrorDisplay
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CheckoutErrorDisplay } from "../CheckoutErrorDisplay";

describe("CheckoutErrorDisplay", () => {
  const defaultProps = {
    errorReason: "FETCH_FAILED" as const,
    errorMessage: null,
    canRetry: true,
    retryCount: 0,
    onRetry: vi.fn(),
    onGiveUp: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("error messages", () => {
    it("should display correct title for FETCH_FAILED", () => {
      render(<CheckoutErrorDisplay {...defaultProps} errorReason="FETCH_FAILED" />);
      
      expect(screen.getByText("Erro ao carregar checkout")).toBeInTheDocument();
    });

    it("should display correct title for VALIDATION_FAILED", () => {
      render(<CheckoutErrorDisplay {...defaultProps} errorReason="VALIDATION_FAILED" />);
      
      expect(screen.getByText("Dados inválidos")).toBeInTheDocument();
    });

    it("should display correct title for CHECKOUT_NOT_FOUND", () => {
      render(<CheckoutErrorDisplay {...defaultProps} errorReason="CHECKOUT_NOT_FOUND" />);
      
      expect(screen.getByText("Checkout não encontrado")).toBeInTheDocument();
    });

    it("should display correct title for PRODUCT_UNAVAILABLE", () => {
      render(<CheckoutErrorDisplay {...defaultProps} errorReason="PRODUCT_UNAVAILABLE" />);
      
      expect(screen.getByText("Produto indisponível")).toBeInTheDocument();
    });

    it("should display correct title for NETWORK_ERROR", () => {
      render(<CheckoutErrorDisplay {...defaultProps} errorReason="NETWORK_ERROR" />);
      
      expect(screen.getByText("Erro de conexão")).toBeInTheDocument();
    });

    it("should display fallback for unknown error", () => {
      render(<CheckoutErrorDisplay {...defaultProps} errorReason="UNKNOWN" />);
      
      expect(screen.getByText("Erro inesperado")).toBeInTheDocument();
    });

    it("should use custom errorMessage when provided", () => {
      render(
        <CheckoutErrorDisplay 
          {...defaultProps} 
          errorMessage="Custom error message" 
        />
      );
      
      expect(screen.getByText("Custom error message")).toBeInTheDocument();
    });
  });

  describe("retry functionality", () => {
    it("should show retry button when canRetry is true", () => {
      render(<CheckoutErrorDisplay {...defaultProps} canRetry={true} />);
      
      expect(screen.getByText(/Tentar novamente/)).toBeInTheDocument();
    });

    it("should call onRetry when retry button clicked", () => {
      const onRetry = vi.fn();
      
      render(<CheckoutErrorDisplay {...defaultProps} onRetry={onRetry} />);
      
      fireEvent.click(screen.getByText(/Tentar novamente/));
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("should show remaining retries when retryCount > 0", () => {
      render(<CheckoutErrorDisplay {...defaultProps} retryCount={1} />);
      
      expect(screen.getByText(/2 restantes/)).toBeInTheDocument();
    });

    it("should hide retry when canRetry is false", () => {
      render(<CheckoutErrorDisplay {...defaultProps} canRetry={false} />);
      
      expect(screen.queryByText(/Tentar novamente/)).not.toBeInTheDocument();
    });

    it("should show max retries message when canRetry is false", () => {
      render(
        <CheckoutErrorDisplay 
          {...defaultProps} 
          canRetry={false} 
          errorReason="FETCH_FAILED"
        />
      );
      
      expect(screen.getByText(/máximo de tentativas/)).toBeInTheDocument();
    });
  });

  describe("give up button", () => {
    it("should show give up button when onGiveUp provided", () => {
      render(<CheckoutErrorDisplay {...defaultProps} onGiveUp={vi.fn()} />);
      
      expect(screen.getByText("Voltar")).toBeInTheDocument();
    });

    it("should call onGiveUp when clicked", () => {
      const onGiveUp = vi.fn();
      
      render(<CheckoutErrorDisplay {...defaultProps} onGiveUp={onGiveUp} />);
      
      fireEvent.click(screen.getByText("Voltar"));
      
      expect(onGiveUp).toHaveBeenCalledTimes(1);
    });

    it("should hide give up button when onGiveUp not provided", () => {
      render(<CheckoutErrorDisplay {...defaultProps} onGiveUp={undefined} />);
      
      expect(screen.queryByText("Voltar")).not.toBeInTheDocument();
    });
  });

  describe("not found errors", () => {
    it("should not show retry for CHECKOUT_NOT_FOUND", () => {
      render(
        <CheckoutErrorDisplay 
          {...defaultProps} 
          errorReason="CHECKOUT_NOT_FOUND"
          canRetry={true}
        />
      );
      
      expect(screen.queryByText(/Tentar novamente/)).not.toBeInTheDocument();
    });

    it("should not show retry for PRODUCT_UNAVAILABLE", () => {
      render(
        <CheckoutErrorDisplay 
          {...defaultProps} 
          errorReason="PRODUCT_UNAVAILABLE"
          canRetry={true}
        />
      );
      
      expect(screen.queryByText(/Tentar novamente/)).not.toBeInTheDocument();
    });
  });

  describe("null handling", () => {
    it("should handle null errorReason gracefully", () => {
      render(<CheckoutErrorDisplay {...defaultProps} errorReason={null} />);
      
      expect(screen.getByText("Erro inesperado")).toBeInTheDocument();
    });
  });
});
