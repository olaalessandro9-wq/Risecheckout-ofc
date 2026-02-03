/**
 * Checkout Public Machine Types
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Type definitions for the XState state machine.
 * 
 * @module checkout-public/machines
 */

import type { ThemePreset } from "@/lib/checkout/themePresets";
import type {
  CheckoutUIModel,
  ProductUIModel,
  OfferUIModel,
  AffiliateUIModel,
  OrderBumpUIModel,
  ResolvedGateways,
} from "../mappers";

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface FormData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  document: string; // Alias for CPF (unified field name)
}

export interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  general?: string;
}

// ============================================================================
// COUPON TYPES
// ============================================================================

export interface CouponData {
  id: string;
  code: string;
  name: string;
  discount_type: 'percentage';
  discount_value: number;
  apply_to_order_bumps: boolean;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface PixPaymentData {
  type: 'pix';
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
}

export interface CardPaymentData {
  type: 'card';
  status: 'approved' | 'pending' | 'rejected';
  message?: string;
}

export type PaymentData = PixPaymentData | CardPaymentData;

// ============================================================================
// NAVIGATION DATA TYPES (re-exported from central types)
// ============================================================================

// Import from central types file (SSOT)
import type { 
  PixNavigationData as PixNavData,
  CardSuccessNavigationData,
  Card3DSNavigationData,
} from "@/types/checkout-payment.types";

// Re-export for module consumers
export type PixNavigationData = PixNavData;

// Card navigation uses union of success and 3DS
export interface CardNavigationData {
  type: 'card';
  orderId: string;
  accessToken: string;
  status: 'approved' | 'pending' | 'rejected';
  requires3DS?: boolean;
  threeDSClientSecret?: string;
}

export type NavigationData = PixNavigationData | CardNavigationData;

// ============================================================================
// CARD FORM DATA (for credit card submission)
// ============================================================================

export interface CardFormData {
  token: string;
  installments: number;
  paymentMethodId?: string;
  issuerId?: string;
  holderDocument?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type ErrorReason = 
  | 'FETCH_FAILED'
  | 'VALIDATION_FAILED'
  | 'CHECKOUT_NOT_FOUND'
  | 'PRODUCT_UNAVAILABLE'
  | 'SUBMIT_FAILED'
  | 'PAYMENT_FAILED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'
  // Backend reasons (resolve-universal)
  | 'NOT_FOUND'    // Slug não existe como checkout nem payment_link
  | 'NO_CHECKOUT'  // Payment Link sem checkout configurado
  | 'INACTIVE'     // Link inativo
  | 'BLOCKED';     // Produto bloqueado

export interface CheckoutError {
  reason: ErrorReason;
  message: string;
  details?: string;
}

// ============================================================================
// PRODUCT PIXELS AND VENDOR INTEGRATION TYPES (Phase 2)
// ============================================================================

export interface ProductPixelData {
  id: string;
  platform: string;
  pixel_id: string;
  access_token?: string | null;
  conversion_label?: string | null;
  domain?: string | null;
  is_active: boolean;
  fire_on_initiate_checkout: boolean;
  fire_on_purchase: boolean;
  fire_on_pix: boolean;
  fire_on_card: boolean;
  fire_on_boleto: boolean;
  custom_value_percent: number;
}

export interface VendorIntegrationData {
  id: string;
  vendor_id: string;
  active: boolean;
  config: unknown;
}

// ============================================================================
// CONTEXT
// ============================================================================

export interface CheckoutPublicContext {
  // === Slug and Raw Data ===
  slug: string | null;
  affiliateCode: string | null;
  rawData: unknown;
  
  // === Loaded Data (immutable after load) ===
  checkout: CheckoutUIModel | null;
  product: ProductUIModel | null;
  offer: OfferUIModel | null;
  orderBumps: OrderBumpUIModel[];
  affiliate: AffiliateUIModel | null;
  design: ThemePreset | null;
  resolvedGateways: ResolvedGateways;
  
  // === Phase 2: BFF Unified Data ===
  productPixels: ProductPixelData[];
  vendorIntegration: VendorIntegrationData | null;
  
  // === Form State ===
  formData: FormData;
  formErrors: FormErrors;
  selectedBumps: string[];
  appliedCoupon: CouponData | null;
  selectedPaymentMethod: 'pix' | 'credit_card';
  
  // === Payment State ===
  orderId: string | null;
  accessToken: string | null;
  paymentData: PaymentData | null;
  navigationData: NavigationData | null;
  
  // === Card Form Data (for credit card submission) ===
  cardFormData: CardFormData | null;
  
  // === Error State ===
  error: CheckoutError | null;
  
  // === Metadata ===
  loadedAt: number | null;
  retryCount: number;
}

// ============================================================================
// EVENTS
// ============================================================================

export type CheckoutPublicEvent =
  // Lifecycle
  | { type: 'LOAD'; slug: string; affiliateCode?: string }
  | { type: 'RETRY' }
  | { type: 'GIVE_UP' }
  
  // Data Loading (internal)
  | { type: 'FETCH_SUCCESS'; data: unknown }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'VALIDATION_SUCCESS' }
  | { type: 'VALIDATION_ERROR'; reason: ErrorReason; message: string }
  
  // Form
  | { type: 'UPDATE_FIELD'; field: keyof FormData; value: string }
  | { type: 'UPDATE_MULTIPLE_FIELDS'; fields: Partial<FormData> }
  | { type: 'TOGGLE_BUMP'; bumpId: string }
  | { type: 'SET_PAYMENT_METHOD'; method: 'pix' | 'credit_card' }
  | { type: 'APPLY_COUPON'; coupon: CouponData }
  | { type: 'REMOVE_COUPON' }
  
  // Submit (with optional card data for credit card payments)
  | { type: 'SUBMIT'; snapshot?: Partial<FormData>; cardData?: CardFormData }
  | { type: 'SUBMIT_SUCCESS'; orderId: string; paymentData: PaymentData; navigationData: NavigationData }
  | { type: 'SUBMIT_ERROR'; error: string }
  
  // Payment
  | { type: 'PAYMENT_CONFIRMED' }
  | { type: 'PAYMENT_FAILED'; error: string }
  | { type: 'PAYMENT_TIMEOUT' };

// ============================================================================
// ACTOR TYPES
// ============================================================================

export interface FetchCheckoutInput {
  slug: string;
  affiliateCode?: string;
}

export interface FetchCheckoutOutput {
  success: boolean;
  data?: unknown;
  error?: string;
  reason?: string; // Backend error reason (NOT_FOUND, NO_CHECKOUT, INACTIVE, BLOCKED)
}

export interface SubmitPaymentInput {
  formData: FormData;
  productId: string;
  offerId: string | null;
  selectedBumps: string[];
  paymentMethod: 'pix' | 'credit_card';
  coupon: CouponData | null;
  resolvedGateways: ResolvedGateways;
  cardToken?: string;
  installments?: number;
  paymentMethodId?: string;
  issuerId?: string;
  holderDocument?: string;
}

export interface SubmitPaymentOutput {
  orderId: string;
  paymentData: PaymentData;
}
