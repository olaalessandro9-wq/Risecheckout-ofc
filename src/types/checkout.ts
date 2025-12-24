/**
 * Tipos TypeScript para o Sistema de Checkout
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
      textColor: string;
      placeholderColor: string;
      borderColor: string;
      backgroundColor: string;
      focusBorderColor: string;
      focusTextColor: string;
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
  image_url?: string;
}

export interface Checkout {
  id: string;
  slug: string;
  name: string;
  product: CheckoutProduct;
  vendor_id?: string;
  rows?: any[];
  top_components?: any[];
  bottom_components?: any[];
}

export interface CouponData {
  code: string;
  discount_type: 'percentage' | 'fixed';
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

export interface TrackingConfig {
  fbConfig?: any;
  utmifyConfig?: any;
  googleAdsIntegration?: any;
  tiktokIntegration?: any;
  kwaiIntegration?: any;
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

export interface CheckoutComponent {
  id: string;
  type: "text" | "image" | "advantage" | "seal" | "timer" | "testimonial" | "video";
  content?: any;
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
