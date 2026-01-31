/**
 * Checkout Public Context Test Factories
 * 
 * Type-safe factory functions for mocking CheckoutPublicMachine context and types.
 * 
 * @module test/factories/checkoutPublicContext
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type {
  CheckoutPublicContext,
  FormData,
  FormErrors,
  CouponData,
  PixPaymentData,
  CardPaymentData,
  PaymentData,
  PixNavigationData,
  CardNavigationData,
  NavigationData,
  CardFormData,
  CheckoutError,
  ErrorReason,
} from "@/modules/checkout-public/machines/checkoutPublicMachine.types";
import type { ResolvedGateways } from "@/modules/checkout-public/mappers";

// ============================================================================
// FORM DATA FACTORIES
// ============================================================================

export function createMockCheckoutFormData(
  overrides?: Partial<FormData>
): FormData {
  return {
    name: "Test Customer",
    email: "customer@test.com",
    phone: "11999999999",
    cpf: "12345678901",
    document: "12345678901",
    ...overrides,
  };
}

export function createMockFormErrors(
  overrides?: Partial<FormErrors>
): FormErrors {
  return {
    ...overrides,
  };
}

// ============================================================================
// COUPON DATA FACTORY
// ============================================================================

export function createMockCouponData(
  overrides?: Partial<CouponData>
): CouponData {
  return {
    id: "coupon-123",
    code: "TEST10",
    name: "Test Coupon",
    discount_type: "percentage",
    discount_value: 10,
    apply_to_order_bumps: true,
    ...overrides,
  };
}

// ============================================================================
// PAYMENT DATA FACTORIES
// ============================================================================

export function createMockPixPaymentData(
  overrides?: Partial<PixPaymentData>
): PixPaymentData {
  return {
    type: "pix",
    qrCode: "00020126360014BR.GOV.BCB.PIX0114+5511999999999",
    qrCodeBase64: "data:image/png;base64,iVBORw0KGgo...",
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    ...overrides,
  };
}

export function createMockCardPaymentData(
  overrides?: Partial<CardPaymentData>
): CardPaymentData {
  return {
    type: "card",
    status: "approved",
    message: "Payment approved",
    ...overrides,
  };
}

// ============================================================================
// NAVIGATION DATA FACTORIES
// ============================================================================

export function createMockPixNavigationData(
  overrides?: Partial<PixNavigationData>
): PixNavigationData {
  return {
    type: "pix",
    orderId: "order-123",
    accessToken: "access-token-123",
    qrCode: "00020126360014BR.GOV.BCB.PIX0114+5511999999999",
    qrCodeBase64: "data:image/png;base64,iVBORw0KGgo...",
    amount: 9900,
    checkoutSlug: "test-checkout",
    gateway: "mercadopago",
    ...overrides,
  };
}

export function createMockCardNavigationData(
  overrides?: Partial<CardNavigationData>
): CardNavigationData {
  return {
    type: "card",
    orderId: "order-123",
    accessToken: "access-token-123",
    status: "approved",
    requires3DS: false,
    ...overrides,
  };
}

// ============================================================================
// CARD FORM DATA FACTORY
// ============================================================================

export function createMockCardFormData(
  overrides?: Partial<CardFormData>
): CardFormData {
  return {
    token: "card-token-123",
    installments: 1,
    paymentMethodId: "visa",
    issuerId: "issuer-123",
    holderDocument: "12345678901",
    ...overrides,
  };
}

// ============================================================================
// CHECKOUT ERROR FACTORY
// ============================================================================

export function createMockCheckoutError(
  overrides?: Partial<CheckoutError>
): CheckoutError {
  return {
    reason: "UNKNOWN" as ErrorReason,
    message: "An unexpected error occurred",
    details: undefined,
    ...overrides,
  };
}

// ============================================================================
// RESOLVED GATEWAYS FACTORY
// ============================================================================

export function createMockResolvedGateways(
  overrides?: Partial<ResolvedGateways>
): ResolvedGateways {
  return {
    pix: "mercadopago",
    creditCard: "mercadopago",
    mercadoPagoPublicKey: null,
    stripePublicKey: null,
    ...overrides,
  };
}

// ============================================================================
// CHECKOUT PUBLIC CONTEXT FACTORY
// ============================================================================

export function createMockCheckoutPublicContext(
  overrides?: Partial<CheckoutPublicContext>
): CheckoutPublicContext {
  return {
    // Slug and Raw Data
    slug: "test-checkout",
    affiliateCode: null,
    rawData: null,
    
    // Loaded Data (immutable after load)
    checkout: null,
    product: null,
    offer: null,
    orderBumps: [],
    affiliate: null,
    design: null,
    resolvedGateways: createMockResolvedGateways(),
    
    // Form State
    formData: createMockCheckoutFormData(),
    formErrors: {},
    selectedBumps: [],
    appliedCoupon: null,
    selectedPaymentMethod: "pix",
    
    // Payment State
    orderId: null,
    accessToken: null,
    paymentData: null,
    navigationData: null,
    
    // Card Form Data
    cardFormData: null,
    
    // Error State
    error: null,
    
    // Metadata
    loadedAt: null,
    retryCount: 0,
    
    ...overrides,
  };
}

// ============================================================================
// CHECKOUT PUBLIC MACHINE SNAPSHOT FACTORY
// ============================================================================

export interface MockCheckoutPublicSnapshot {
  context: CheckoutPublicContext;
  value: string | Record<string, unknown>;
  matches: (state: string) => boolean;
  can: (event: { type: string }) => boolean;
  status: "active" | "done" | "error" | "stopped";
}

export function createMockCheckoutPublicSnapshot(
  context?: Partial<CheckoutPublicContext>,
  stateValue: string | Record<string, unknown> = "ready"
): MockCheckoutPublicSnapshot {
  const fullContext = createMockCheckoutPublicContext(context);
  
  return {
    context: fullContext,
    value: stateValue,
    matches: vi.fn((state: string) => {
      if (typeof stateValue === "string") {
        return state === stateValue;
      }
      return Object.keys(stateValue).includes(state);
    }),
    can: vi.fn(() => true),
    status: "active",
  };
}
