/**
 * CheckoutPublicLoader Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests loading states, error display, and content rendering.
 * 
 * @module test/modules/checkout-public/components/CheckoutPublicLoader
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckoutPublicLoader } from "../CheckoutPublicLoader";
import * as hooks from "../../hooks";

// Mock the hook
vi.mock("../../hooks", () => ({
  useCheckoutPublicMachine: vi.fn(),
}));

// Mock child components
vi.mock("../CheckoutErrorDisplay", () => ({
  CheckoutErrorDisplay: ({ errorReason }: { errorReason: string }) => (
    <div data-testid="error-display">Error: {errorReason}</div>
  ),
}));

vi.mock("../CheckoutPublicContent", () => ({
  CheckoutPublicContent: () => (
    <div data-testid="checkout-content">Checkout Content</div>
  ),
}));

// Factory for mock machine state
function createMockMachine(overrides: Partial<ReturnType<typeof hooks.useCheckoutPublicMachine>> = {}) {
  return {
    isIdle: false,
    isLoading: false,
    isValidating: false,
    isError: false,
    isReady: false,
    isSubmitting: false,
    isPaymentPending: false,
    isSuccess: false,
    errorReason: null,
    errorMessage: null,
    canRetry: true,
    retryCount: 0,
    retry: vi.fn(),
    giveUp: vi.fn(),
    checkout: null,
    product: null,
    design: null,
    ...overrides,
  } as ReturnType<typeof hooks.useCheckoutPublicMachine>;
}

describe("CheckoutPublicLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading states", () => {
    it("should show loading spinner when idle", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockMachine({ isIdle: true })
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByText("Carregando checkout...")).toBeInTheDocument();
    });

    it("should show loading spinner when loading", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockMachine({ isLoading: true })
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByText("Carregando checkout...")).toBeInTheDocument();
    });

    it("should show loading spinner when validating", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockMachine({ isValidating: true })
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByText("Carregando checkout...")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("should show error display when isError", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockMachine({ 
          isError: true, 
          errorReason: "FETCH_FAILED" as const,
        })
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByText(/FETCH_FAILED/)).toBeInTheDocument();
    });
  });

  describe("ready state", () => {
    const mockCheckout = { id: "checkout-1" };
    const mockProduct = { id: "product-1" };
    const mockDesign = { backgroundColor: "#fff" };

    it("should show content when ready with data", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockMachine({
          isReady: true,
          checkout: mockCheckout as never,
          product: mockProduct as never,
          design: mockDesign as never,
        })
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("checkout-content")).toBeInTheDocument();
    });

    it("should show content when submitting", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockMachine({
          isSubmitting: true,
          checkout: mockCheckout as never,
          product: mockProduct as never,
          design: mockDesign as never,
        })
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("checkout-content")).toBeInTheDocument();
    });

    it("should show content when payment pending", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockMachine({
          isPaymentPending: true,
          checkout: mockCheckout as never,
          product: mockProduct as never,
          design: mockDesign as never,
        })
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("checkout-content")).toBeInTheDocument();
    });

    it("should show content when success", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockMachine({
          isSuccess: true,
          checkout: mockCheckout as never,
          product: mockProduct as never,
          design: mockDesign as never,
        })
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("checkout-content")).toBeInTheDocument();
    });
  });

  describe("fallback state", () => {
    it("should show not found error when no data available", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockMachine({
          isReady: true,
          checkout: null,
          product: null,
          design: null,
        })
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByText(/CHECKOUT_NOT_FOUND/)).toBeInTheDocument();
    });
  });
});
