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
import { THEME_PRESETS } from "@/lib/checkout/themePresets";

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
  vendorId: "vendor-001",
  name: "Checkout Principal",
  slug: "checkout-principal",
  visits_count: 100,
  seller_name: "Loja Teste",
  font: "Inter",
  theme: "light",
};

export const mockProductUI: ProductUIModel = {
  id: "prod-001",
  name: "Curso Completo de Marketing",
  description: "Aprenda marketing digital do zero",
  price: 29700, // R$ 297,00
  image_url: "https://example.com/product.jpg",
  required_fields: {
    name: true,
    email: true,
    phone: false,
    cpf: false,
  },
  default_payment_method: "pix",
};

export const mockOfferUI: OfferUIModel = {
  offerId: "offer-001",
  offerName: "Oferta Especial",
  offerPrice: 19700, // R$ 197,00
};

export const mockOrderBumpUI: OrderBumpUIModel = {
  id: "bump-001",
  product_id: "prod-bump-001",
  name: "Bônus Exclusivo",
  description: "Material complementar",
  price: 4700, // R$ 47,00
  original_price: 9700,
  image_url: "https://example.com/bump.jpg",
  call_to_action: "Adicionar ao pedido",
};

export const mockAffiliateUI: AffiliateUIModel = {
  affiliateId: "aff-001",
  affiliateCode: "PARCEIRO123",
  affiliateUserId: "user-aff-001",
  commissionRate: 30,
  pixGateway: null,
  creditCardGateway: null,
};

export const mockResolvedGateways: ResolvedGateways = {
  pix: "mercadopago",
  creditCard: "mercadopago",
  mercadoPagoPublicKey: "TEST-public-key-123",
  stripePublicKey: null,
};

export const mockDesign: ThemePreset = THEME_PRESETS.light;

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
  gateway: "mercadopago",
  amount: 29700,
  checkoutSlug: "checkout-principal",
  qrCode: "00020126580014br.gov.bcb.pix...",
  qrCodeBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
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
    pix: "mercadopago",
    creditCard: "mercadopago",
    mercadoPagoPublicKey: null,
    stripePublicKey: null,
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
