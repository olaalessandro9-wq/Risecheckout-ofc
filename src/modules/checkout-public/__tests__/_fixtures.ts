/**
 * @file _fixtures.ts
 * @description Test fixtures for Checkout Public module
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import type {
  CheckoutPublicContext,
  FormData,
  FormErrors,
  CouponData,
  PixPaymentData,
  CardPaymentData,
  PixNavigationData,
  CardNavigationData,
  CheckoutError,
  CardFormData,
} from "../machines/checkoutPublicMachine.types";
import type {
  CheckoutUIModel,
  ProductUIModel,
  OfferUIModel,
  OrderBumpUIModel,
  AffiliateUIModel,
  ResolvedGateways,
} from "../mappers";
import type { ThemePreset } from "@/lib/checkout/themePresets";

// ============================================================================
// FORM DATA
// ============================================================================

export const mockFormData: FormData = {
  name: "João Silva",
  email: "joao.silva@example.com",
  phone: "(11) 98765-4321",
  cpf: "123.456.789-00",
  document: "123.456.789-00",
};

export const mockFormDataIncomplete: FormData = {
  name: "Maria",
  email: "",
  phone: "",
  cpf: "",
  document: "",
};

export const mockFormErrors: FormErrors = {
  email: "Email inválido",
  cpf: "CPF inválido",
};

// ============================================================================
// CHECKOUT DATA
// ============================================================================

export const mockCheckoutUI: CheckoutUIModel = {
  id: "checkout-001",
  name: "Checkout Principal",
  slug: "checkout-principal",
  productId: "prod-001",
  theme: "light",
  primaryColor: "#4F46E5",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  pixEnabled: true,
  cardEnabled: true,
  boletoEnabled: false,
};

export const mockProductUI: ProductUIModel = {
  id: "prod-001",
  name: "Curso Completo de Marketing",
  description: "Aprenda marketing digital do zero",
  price: 29700, // R$ 297,00
  imageUrl: "https://example.com/product.jpg",
  maxInstallments: 12,
  supportEmail: "suporte@example.com",
};

export const mockOfferUI: OfferUIModel = {
  id: "offer-001",
  name: "Oferta Especial",
  description: "Desconto exclusivo",
  price: 19700, // R$ 197,00
  originalPrice: 29700,
  type: "upsell",
};

export const mockOrderBumpUI: OrderBumpUIModel = {
  id: "bump-001",
  name: "Bônus Exclusivo",
  description: "Material complementar",
  price: 4700, // R$ 47,00
  originalPrice: 9700,
  imageUrl: "https://example.com/bump.jpg",
  displayOrder: 1,
};

export const mockAffiliateUI: AffiliateUIModel = {
  id: "aff-001",
  code: "PARCEIRO123",
  name: "Parceiro Afiliado",
  commissionRate: 30,
};

export const mockResolvedGateways: ResolvedGateways = {
  pixGateway: "mercadopago",
  cardGateway: "mercadopago",
  publicKeys: {
    mercadopago: "TEST-public-key-123",
  },
};

export const mockDesign: ThemePreset = {
  name: "Modern",
  colors: {
    primary: "#4F46E5",
    background: "#FFFFFF",
    text: "#1F2937",
    accent: "#10B981",
  },
  fonts: {
    heading: "Inter",
    body: "Inter",
  },
};

// ============================================================================
// COUPON
// ============================================================================

export const mockCoupon: CouponData = {
  id: "coupon-001",
  code: "DESCONTO20",
  name: "Desconto de 20%",
  discount_type: "percentage",
  discount_value: 20,
  apply_to_order_bumps: true,
};

// ============================================================================
// PAYMENT DATA
// ============================================================================

export const mockPixPayment: PixPaymentData = {
  type: "pix",
  qrCode: "00020126580014br.gov.bcb.pix...",
  qrCodeBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  expiresAt: "2026-01-31T23:59:59Z",
};

export const mockCardPaymentApproved: CardPaymentData = {
  type: "card",
  status: "approved",
  message: "Pagamento aprovado",
};

export const mockCardPaymentRejected: CardPaymentData = {
  type: "card",
  status: "rejected",
  message: "Pagamento recusado",
};

export const mockCardFormData: CardFormData = {
  token: "card_token_abc123",
  installments: 3,
  paymentMethodId: "visa",
  issuerId: "issuer_123",
  holderDocument: "12345678900",
};

// ============================================================================
// NAVIGATION DATA
// ============================================================================

export const mockPixNavigation: PixNavigationData = {
  type: "pix",
  orderId: "order-001",
  accessToken: "access_token_xyz",
  qrCode: "00020126580014br.gov.bcb.pix...",
  qrCodeBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  expiresAt: "2026-01-31T23:59:59Z",
};

export const mockCardNavigation: CardNavigationData = {
  type: "card",
  orderId: "order-002",
  accessToken: "access_token_abc",
  status: "approved",
  requires3DS: false,
};

export const mockCard3DSNavigation: CardNavigationData = {
  type: "card",
  orderId: "order-003",
  accessToken: "access_token_3ds",
  status: "pending",
  requires3DS: true,
  threeDSClientSecret: "secret_3ds_xyz",
};

// ============================================================================
// ERRORS
// ============================================================================

export const mockCheckoutError: CheckoutError = {
  reason: "FETCH_FAILED",
  message: "Falha ao carregar checkout",
  details: "Network error",
};

export const mockValidationError: CheckoutError = {
  reason: "VALIDATION_FAILED",
  message: "Dados inválidos",
};

export const mockPaymentError: CheckoutError = {
  reason: "PAYMENT_FAILED",
  message: "Pagamento recusado",
  details: "Cartão sem limite",
};

// ============================================================================
// CONTEXT
// ============================================================================

export const mockInitialContext: CheckoutPublicContext = {
  slug: null,
  affiliateCode: null,
  rawData: null,
  checkout: null,
  product: null,
  offer: null,
  orderBumps: [],
  affiliate: null,
  design: null,
  resolvedGateways: {
    pixGateway: null,
    cardGateway: null,
    publicKeys: {},
  },
  formData: {
    name: "",
    email: "",
    phone: "",
    cpf: "",
    document: "",
  },
  formErrors: {},
  selectedBumps: [],
  appliedCoupon: null,
  selectedPaymentMethod: "pix",
  orderId: null,
  accessToken: null,
  paymentData: null,
  navigationData: null,
  cardFormData: null,
  error: null,
  loadedAt: null,
  retryCount: 0,
};

export const mockLoadedContext: CheckoutPublicContext = {
  ...mockInitialContext,
  slug: "checkout-principal",
  checkout: mockCheckoutUI,
  product: mockProductUI,
  orderBumps: [mockOrderBumpUI],
  design: mockDesign,
  resolvedGateways: mockResolvedGateways,
  loadedAt: Date.now(),
};

export const mockFormFilledContext: CheckoutPublicContext = {
  ...mockLoadedContext,
  formData: mockFormData,
  selectedBumps: ["bump-001"],
  appliedCoupon: mockCoupon,
};

export const mockPixPaymentContext: CheckoutPublicContext = {
  ...mockFormFilledContext,
  orderId: "order-001",
  accessToken: "access_token_xyz",
  paymentData: mockPixPayment,
  navigationData: mockPixNavigation,
};

export const mockCardPaymentContext: CheckoutPublicContext = {
  ...mockFormFilledContext,
  selectedPaymentMethod: "credit_card",
  cardFormData: mockCardFormData,
  orderId: "order-002",
  accessToken: "access_token_abc",
  paymentData: mockCardPaymentApproved,
  navigationData: mockCardNavigation,
};

export const mockErrorContext: CheckoutPublicContext = {
  ...mockInitialContext,
  slug: "invalid-slug",
  error: mockCheckoutError,
  retryCount: 1,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Creates a mock CheckoutPublicContext with custom overrides
 */
export function createMockContext(
  overrides: Partial<CheckoutPublicContext> = {}
): CheckoutPublicContext {
  return {
    ...mockInitialContext,
    ...overrides,
  };
}

/**
 * Creates a mock FormData with custom overrides
 */
export function createMockFormData(
  overrides: Partial<FormData> = {}
): FormData {
  return {
    ...mockFormData,
    ...overrides,
  };
}
