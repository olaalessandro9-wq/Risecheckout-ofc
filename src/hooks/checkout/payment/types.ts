/**
 * Payment Types - Tipos centralizados para o módulo de pagamento
 * 
 * Arquivo único de tipos elimina inconsistências entre hooks.
 */

import type { PaymentMethod, CheckoutFormData } from "@/types/checkout";

// ============================================================================
// GATEWAY TYPES
// ============================================================================

export type PixGateway = 'pushinpay' | 'mercadopago' | 'stripe' | 'asaas';
export type CreditCardGateway = 'mercadopago' | 'stripe' | 'asaas';

// ============================================================================
// COUPON
// ============================================================================

export interface AppliedCoupon {
  id: string;
  code: string;
  name: string;
  discount_type: "percentage";
  discount_value: number;
  apply_to_order_bumps: boolean;
}

// ============================================================================
// ORDER CREATION
// ============================================================================

export interface CreateOrderPayload {
  product_id: string | null;
  offer_id: string | null;
  checkout_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_cpf: string | null;
  order_bump_ids: string[];
  gateway: string;
  payment_method: PaymentMethod;
  coupon_id: string | null;
  affiliate_code: string | null;
}

export interface CreateOrderResult {
  success: boolean;
  order_id: string;
  access_token: string;
  error?: string;
}

// ============================================================================
// PAYMENT PROCESSING
// ============================================================================

export interface CardPaymentData {
  token: string;
  installments: number;
  paymentMethodId?: string;
  issuerId?: string;
  holderDocument?: string; // CPF do titular do cartão
}

export interface PaymentConfig {
  vendorId: string | null;
  checkoutId: string | null;
  productId: string | null;
  offerId?: string | null;
  productName: string | null;
  productPrice: number;
  publicKey: string | null;
  formData: CheckoutFormData;
  pixGateway: PixGateway;
  creditCardGateway: CreditCardGateway;
}

export interface PaymentState {
  orderId: string | null;
  accessToken: string | null;
  isProcessing: boolean;
  error: string | null;
}

// ============================================================================
// NAVIGATION STATE
// ============================================================================

export interface PixNavigationState {
  gateway: PixGateway;
  accessToken: string;
  amount: number;
  qrCode?: string;
  qrCodeBase64?: string;
  qrCodeText?: string;
}

export interface SuccessNavigationState {
  orderId: string;
  accessToken?: string;
}
