/**
 * CheckoutPublicLoader Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Uses `as unknown as T` pattern for vi.mocked() calls.
 * Justification: vi.mocked requires full type match, but tests only need
 * the subset of properties actually consumed by the component.
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

// Mock CheckoutSkeleton (Zero Latency Architecture)
vi.mock("../CheckoutSkeleton", () => ({
  CheckoutSkeleton: () => (
    <div data-testid="checkout-skeleton">Loading Skeleton</div>
  ),
}));

// Type alias for mock return type
type CheckoutMachineReturn = ReturnType<typeof hooks.useCheckoutPublicMachine>;

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

interface MockCheckoutMachine {
  isIdle: boolean;
  isLoading: boolean;
  isValidating: boolean;
  isError: boolean;
  isReady: boolean;
  isSubmitting: boolean;
  isPaymentPending: boolean;
  isSuccess: boolean;
  errorReason: string | null;
  errorMessage: string | null;
  canRetry: boolean;
  retryCount: number;
  retry: ReturnType<typeof vi.fn>;
  giveUp: ReturnType<typeof vi.fn>;
  checkout: { id: string } | null;
  product: { id: string } | null;
  design: { backgroundColor: string } | null;
}

function createMockCheckoutMachine(
  overrides?: Partial<MockCheckoutMachine>
): MockCheckoutMachine {
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
  };
}

describe("CheckoutPublicLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading states", () => {
    it("should show loading spinner when idle", () => {
      // RISE V3 Justified: Partial mock - component only uses subset of machine state
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockCheckoutMachine({ isIdle: true }) as unknown as CheckoutMachineReturn
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("checkout-skeleton")).toBeInTheDocument();
    });

    it("should show loading spinner when loading", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockCheckoutMachine({ isLoading: true }) as unknown as CheckoutMachineReturn
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("checkout-skeleton")).toBeInTheDocument();
    });

    it("should show loading spinner when validating", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockCheckoutMachine({ isValidating: true }) as unknown as CheckoutMachineReturn
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("checkout-skeleton")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("should show error display when isError", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockCheckoutMachine({ 
          isError: true, 
          errorReason: "FETCH_FAILED",
        }) as unknown as CheckoutMachineReturn
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
        createMockCheckoutMachine({
          isReady: true,
          checkout: mockCheckout,
          product: mockProduct,
          design: mockDesign,
        }) as unknown as CheckoutMachineReturn
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("checkout-content")).toBeInTheDocument();
    });

    it("should show content when submitting", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockCheckoutMachine({
          isSubmitting: true,
          checkout: mockCheckout,
          product: mockProduct,
          design: mockDesign,
        }) as unknown as CheckoutMachineReturn
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("checkout-content")).toBeInTheDocument();
    });

    it("should show content when payment pending", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockCheckoutMachine({
          isPaymentPending: true,
          checkout: mockCheckout,
          product: mockProduct,
          design: mockDesign,
        }) as unknown as CheckoutMachineReturn
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("checkout-content")).toBeInTheDocument();
    });

    it("should show content when success", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockCheckoutMachine({
          isSuccess: true,
          checkout: mockCheckout,
          product: mockProduct,
          design: mockDesign,
        }) as unknown as CheckoutMachineReturn
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("checkout-content")).toBeInTheDocument();
    });
  });

  describe("fallback state", () => {
    it("should show not found error when no data available", () => {
      vi.mocked(hooks.useCheckoutPublicMachine).mockReturnValue(
        createMockCheckoutMachine({
          isReady: true,
          checkout: null,
          product: null,
          design: null,
        }) as unknown as CheckoutMachineReturn
      );

      render(<CheckoutPublicLoader />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByText(/CHECKOUT_NOT_FOUND/)).toBeInTheDocument();
    });
  });
});
