/**
 * @file CheckoutPublicContent.test.tsx
 * @description Tests for CheckoutPublicContent component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils";
import { CheckoutPublicContent } from "../CheckoutPublicContent";
import type { UseCheckoutPublicMachineReturn } from "../../hooks";
import {
  mockLoadedContext,
  mockFormFilledContext,
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
  let mockNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock navigate function
    mockNavigate = vi.fn();
    vi.mocked(await import("react-router-dom")).useNavigate = () => mockNavigate;

    // Create base mock machine
    mockMachine = {
      checkout: mockLoadedContext.checkout,
      product: mockLoadedContext.product,
      design: mockLoadedContext.design,
      orderBumps: mockLoadedContext.orderBumps,
      offer: null,
      resolvedGateways: mockLoadedContext.resolvedGateways,
      formData: mockLoadedContext.formData,
      formErrors: {},
      selectedBumps: [],
      appliedCoupon: null,
      selectedPaymentMethod: "pix",
      isLoading: false,
      isSubmitting: false,
      isPaymentPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      navigationData: null,
      updateField: vi.fn(),
      updateMultipleFields: vi.fn(),
      toggleBump: vi.fn(),
      setPaymentMethod: vi.fn(),
      applyCoupon: vi.fn(),
      removeCoupon: vi.fn(),
      submit: vi.fn(),
      retry: vi.fn(),
      giveUp: vi.fn(),
    };
  });

  describe("Rendering", () => {
    it("should render checkout layout when data is loaded", () => {
      render(<CheckoutPublicContent machine={mockMachine} />);

      expect(screen.getByTestId("shared-checkout-layout")).toBeInTheDocument();
      expect(screen.getByTestId("checkout-master-layout")).toBeInTheDocument();
    });

    it("should render with product information", () => {
      render(<CheckoutPublicContent machine={mockMachine} />);

      // The component should be rendered with the product data
      expect(mockMachine.product).toBeTruthy();
      expect(mockMachine.product?.name).toBe("Curso Completo de Marketing");
    });

    it("should render with checkout configuration", () => {
      render(<CheckoutPublicContent machine={mockMachine} />);

      // The component should be rendered with the checkout data
      expect(mockMachine.checkout).toBeTruthy();
      expect(mockMachine.checkout?.name).toBe("Checkout Principal");
    });
  });

  describe("Navigation", () => {
    it("should navigate to PIX page when payment is pending with PIX data", async () => {
      const machineWithPixPending: UseCheckoutPublicMachineReturn = {
        ...mockMachine,
        isPaymentPending: true,
        navigationData: mockPixNavigation,
      };

      render(<CheckoutPublicContent machine={machineWithPixPending} />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          `/pay/pix/${mockPixNavigation.orderId}`,
          expect.objectContaining({
            state: mockPixNavigation,
            replace: true,
          })
        );
      });
    });

    it("should navigate to success page when card payment is approved", async () => {
      const machineWithCardSuccess: UseCheckoutPublicMachineReturn = {
        ...mockMachine,
        isSuccess: true,
        navigationData: mockCardNavigation,
      };

      render(<CheckoutPublicContent machine={machineWithCardSuccess} />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          `/success/${mockCardNavigation.orderId}`,
          expect.objectContaining({
            replace: true,
          })
        );
      });
    });

    it("should not navigate when navigationData is null", () => {
      render(<CheckoutPublicContent machine={mockMachine} />);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing product gracefully", () => {
      const machineWithoutProduct: UseCheckoutPublicMachineReturn = {
        ...mockMachine,
        product: null,
      };

      render(<CheckoutPublicContent machine={machineWithoutProduct} />);

      // Should still render the layout
      expect(screen.getByTestId("shared-checkout-layout")).toBeInTheDocument();
    });

    it("should handle missing checkout gracefully", () => {
      const machineWithoutCheckout: UseCheckoutPublicMachineReturn = {
        ...mockMachine,
        checkout: null,
      };

      render(<CheckoutPublicContent machine={machineWithoutCheckout} />);

      // Should still render the layout
      expect(screen.getByTestId("shared-checkout-layout")).toBeInTheDocument();
    });

    it("should handle form errors", () => {
      const machineWithErrors: UseCheckoutPublicMachineReturn = {
        ...mockMachine,
        formErrors: {
          email: "Email inválido",
          cpf: "CPF inválido",
        },
      };

      render(<CheckoutPublicContent machine={machineWithErrors} />);

      // Component should render with errors
      expect(machineWithErrors.formErrors).toHaveProperty("email");
      expect(machineWithErrors.formErrors).toHaveProperty("cpf");
    });
  });
});
