/**
 * Tipos TypeScript para o Sistema de Checkout
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Este arquivo centraliza todas as definições de tipos para garantir
 * Type Safety em todo o sistema de checkout.
 */

// ============================================================================
// TIPOS DE DADOS DO CHECKOUT
// ============================================================================

export interface CheckoutProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  required_fields: string[];
}

export interface CheckoutDesign {
  colors: {
    background: string;
    formBackground: string;
    primaryText: string;
    secondaryText: string;
    border: string;
    active: string;
    productPrice?: string;
    placeholder?: string;
    button?: {
      background: string;
      text: string;
    };
    selectedButton?: {
      background: string;
      text: string;
    };
    unselectedButton?: {
      background: string;
      text: string;
      icon: string;
    };
    creditCardFields?: {
      textColor?: string;
      placeholderColor?: string;
      borderColor?: string;
      backgroundColor?: string;
      focusBorderColor?: string;
      focusTextColor?: string;
    };
  };
  typography?: {
    fontFamily?: string;
  };
}

export interface OrderBump {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  call_to_action?: string;
  product_id?: string;
  product?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string | null;
  };
  offer?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface ProductData {
  id?: string;
  name?: string;
  price?: number;
  image_url?: string;
  description?: string;
  required_fields?: {
    name?: boolean;
    email?: boolean;
    phone?: boolean;
    cpf?: boolean;
    document?: boolean;
  };
}

export interface UpsellSettings {
  enabled: boolean;
  redirectUrl?: string;
  productId?: string;
  offerId?: string;
}

export interface AffiliateSettings {
  enabled?: boolean;
  commissionPercentage?: number;
  cookieDuration?: number;
  attributionModel?: 'last_click' | 'first_click';
}

export interface Checkout {
  id: string;
  slug: string;
  name: string;
  product: CheckoutProduct;
  vendor_id?: string;
  rows?: CheckoutRow[];
  top_components?: CheckoutComponent[];
  bottom_components?: CheckoutComponent[];
}

export interface CouponData {
  code: string;
  discount_type: 'percentage';
  discount_value: number;
}

// ============================================================================
// TIPOS DE FORMULÁRIO
// ============================================================================

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  document: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

export interface CheckoutFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

// ============================================================================
// TIPOS DE PAGAMENTO
// ============================================================================

export type PaymentMethod = 'pix' | 'credit_card';

export interface PaymentGatewayConfig {
  public_key: string;
  access_token?: string;
}

export interface CardData {
  token: string;
  payment_method_id: string;
  issuer_id: string;
  installments: number;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

// ============================================================================
// TIPOS DE TRACKING
// ============================================================================

import type { UTMifyIntegration } from "@/integrations/tracking/utmify/types";

/**
 * TrackingConfig simplificado - apenas UTMify (não migrou para product_pixels)
 * Outros pixels (Facebook, Google Ads, TikTok, Kwai) agora usam product_pixels.
 */
export interface TrackingConfig {
  utmifyConfig?: UTMifyIntegration | null;
}

export interface PurchaseData {
  orderId: string;
  totalCents: number;
  customerData: {
    name: string;
    email: string;
    phone: string;
  };
}

// ============================================================================
// TIPOS DE ESTADO DO CHECKOUT
// ============================================================================

export interface CheckoutState {
  isLoading: boolean;
  isError: boolean;
  checkout: Checkout | null;
  design: CheckoutDesign | null;
  orderBumps: OrderBump[];
  selectedPayment: PaymentMethod;
  finalTotalWithDiscount: number | null;
  appliedCouponData: CouponData | null;
}

export interface FormState {
  formData: CheckoutFormData;
  formErrors: CheckoutFormErrors;
  selectedBumps: Set<string>;
  isProcessing: boolean;
}

export interface PaymentState {
  isBrickReady: boolean;
  isSDKLoaded: boolean;
  showPixPayment: boolean;
  orderId: string | null;
}

// ============================================================================
// TIPOS DO CHECKOUT BUILDER
// ============================================================================

// Re-exportar tipos centralizados do builder (RISE ARCHITECT PROTOCOL V3 - 10.0/10)
export type { 
  CheckoutComponentType, 
  CheckoutComponentContent 
} from "./checkout-components.types";

// Importar para uso local
import type { CheckoutComponentType, CheckoutComponentContent } from "./checkout-components.types";

export interface CheckoutComponent {
  id: string;
  type: CheckoutComponentType;
  content?: CheckoutComponentContent;
}

// Re-exportar tipos do useCheckoutEditor (apenas os que existem)
export type { CheckoutCustomization, ViewMode } from "@/hooks/useCheckoutEditor";

// Tipos locais para o checkout builder
export type LayoutType = "full" | "single" | "two-columns" | "two-columns-asymmetric" | "three-columns" | "sidebar";

export interface CheckoutRow {
  id: string;
  layout: LayoutType;
  columns: CheckoutComponent[][];
  components?: CheckoutComponent[];
}
