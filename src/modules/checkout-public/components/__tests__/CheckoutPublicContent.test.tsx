/**
 * @file CheckoutPublicContent.test.tsx
 * @description Tests for CheckoutPublicContent component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@/test/utils";
import { CheckoutPublicContent } from "../CheckoutPublicContent";
import type { UseCheckoutPublicMachineReturn } from "../../hooks";
import {
  mockLoadedContext,
  mockPixNavigation,
  mockCardNavigation,
} from "../../__tests__/_fixtures";

// Mock dependencies
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/contexts/CheckoutContext", () => ({
  CheckoutProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/checkout/v2/TrackingManager", () => ({
  TrackingManager: () => null,
}));

vi.mock("@/components/checkout/shared", () => ({
  SharedCheckoutLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shared-checkout-layout">{children}</div>
  ),
}));

vi.mock("@/components/checkout/unified", () => ({
  CheckoutMasterLayout: () => <div data-testid="checkout-master-layout">Checkout Layout</div>,
}));

vi.mock("@/hooks/checkout/useTrackingService", () => ({
  useTrackingService: () => ({
    trackEvent: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAffiliateTracking", () => ({
  useAffiliateTracking: () => ({
    trackAffiliateClick: vi.fn(),
  }),
}));

vi.mock("@/hooks/checkout/useCheckoutProductPixels", () => ({
  useCheckoutProductPixels: () => ({
    pixels: [],
  }),
}));

vi.mock("@/hooks/checkout/useVisitTracker", () => ({
  useVisitTracker: () => ({
    trackVisit: vi.fn(),
  }),
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe("CheckoutPublicContent", () => {
  let mockMachine: UseCheckoutPublicMachineReturn;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMachine = {
      // State Flags
      isIdle: false,
      isLoading: false,
      isValidating: false,
      isReady: true,
      isSubmitting: false,
      isPaymentPending: false,
      isSuccess: false,
      isError: false,
      
      // Error Info
      errorReason: null,
      errorMessage: null,
      canRetry: false,
      retryCount: 0,
      
      // Loaded Data
      checkout: mockLoadedContext.checkout,
      product: mockLoadedContext.product,
      design: mockLoadedContext.design,
      orderBumps: mockLoadedContext.orderBumps,
      offer: null,
      resolvedGateways: mockLoadedContext.resolvedGateways,
      affiliate: null,
      
      // Form State
      formData: mockLoadedContext.formData,
      formErrors: {},
      selectedBumps: [],
      appliedCoupon: null,
      selectedPaymentMethod: "pix",
      
      // Payment State
      orderId: null,
      accessToken: null,
      paymentData: null,
      navigationData: null,
      
      // Actions
      load: vi.fn(),
      updateField: vi.fn(),
      updateMultipleFields: vi.fn(),
      toggleBump: vi.fn(),
      setPaymentMethod: vi.fn(),
      applyCoupon: vi.fn(),
      removeCoupon: vi.fn(),
      submit: vi.fn(),
      retry: vi.fn(),
      giveUp: vi.fn(),
      notifyPaymentSuccess: vi.fn(),
      notifyPaymentError: vi.fn(),
      notifyPaymentConfirmed: vi.fn(),
      notifyPaymentFailed: vi.fn(),
      notifyPaymentTimeout: vi.fn(),
    };
  });

  describe("Rendering", () => {
    it("should render without crashing with loaded data", () => {
      expect(() => render(<CheckoutPublicContent machine={mockMachine} />)).not.toThrow();
    });

    it("should render without crashing with missing product", () => {
      const machineWithoutProduct: UseCheckoutPublicMachineReturn = {
        ...mockMachine,
        product: null,
      };

      expect(() => render(<CheckoutPublicContent machine={machineWithoutProduct} />)).not.toThrow();
    });

    it("should render without crashing with missing checkout", () => {
      const machineWithoutCheckout: UseCheckoutPublicMachineReturn = {
        ...mockMachine,
        checkout: null,
      };

      expect(() => render(<CheckoutPublicContent machine={machineWithoutCheckout} />)).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle form errors", () => {
      const machineWithErrors: UseCheckoutPublicMachineReturn = {
        ...mockMachine,
        formErrors: {
          email: "Email inválido",
          cpf: "CPF inválido",
        },
      };

      expect(() => render(<CheckoutPublicContent machine={machineWithErrors} />)).not.toThrow();
    });

    it("should handle PIX payment pending state", () => {
      const machineWithPixPending: UseCheckoutPublicMachineReturn = {
        ...mockMachine,
        isPaymentPending: true,
        navigationData: mockPixNavigation,
      };

      expect(() => render(<CheckoutPublicContent machine={machineWithPixPending} />)).not.toThrow();
    });

    it("should handle card payment success state", () => {
      const machineWithCardSuccess: UseCheckoutPublicMachineReturn = {
        ...mockMachine,
        isSuccess: true,
        navigationData: mockCardNavigation,
      };

      expect(() => render(<CheckoutPublicContent machine={machineWithCardSuccess} />)).not.toThrow();
    });
  });
});
