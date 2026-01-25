/**
 * Checkout Payment Types - Tipos centralizados para pagamentos
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Single Source of Truth para todos os tipos relacionados a pagamentos
 * no checkout público e páginas de pagamento.
 * 
 * @module types/checkout-payment
 */

// ============================================================================
// GATEWAY TYPES
// ============================================================================

export type PixGateway = 'pushinpay' | 'mercadopago' | 'stripe' | 'asaas';
export type CreditCardGateway = 'mercadopago' | 'stripe' | 'asaas';
export type PaymentMethod = 'pix' | 'credit_card';

// ============================================================================
// PAYMENT STATUS
// ============================================================================

export type PixPaymentStatus = 'waiting' | 'paid' | 'expired' | 'error';
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded' | 'expired';

// ============================================================================
// NAVIGATION DATA
// ============================================================================

/**
 * Dados de navegação para página PIX
 * Enviados via React Router state após processamento no XState actor
 */
export interface PixNavigationData {
  type: 'pix';
  orderId: string;
  accessToken: string;
  gateway: PixGateway;
  amount: number;
  checkoutSlug: string;
  qrCode?: string;
  qrCodeBase64?: string;
  qrCodeText?: string;
}

/**
 * Dados de navegação para página de sucesso (cartão aprovado)
 */
export interface CardSuccessNavigationData {
  type: 'card_success';
  orderId: string;
  accessToken?: string;
}

/**
 * Dados de navegação para 3D Secure (Stripe)
 */
export interface Card3DSNavigationData {
  type: 'card_3ds';
  orderId: string;
  clientSecret: string;
  gateway: CreditCardGateway;
}

export type PaymentNavigationData = 
  | PixNavigationData 
  | CardSuccessNavigationData 
  | Card3DSNavigationData;

// ============================================================================
// ORDER DATA
// ============================================================================

/**
 * Dados do pedido retornados pela RPC/Edge Function
 * Usados na página de pagamento PIX
 */
export interface OrderDataForPayment {
  id: string;
  amount_cents: number;
  vendor_id: string;
  product_id?: string;
  product?: {
    id: string;
    name: string;
  } | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_document?: string | null;
  created_at?: string;
  tracking_parameters?: Record<string, unknown> | null;
  status?: OrderStatus;
  pix_qr_code?: string | null;
  pix_status?: string | null;
  pix_id?: string | null;
  checkout_id?: string | null;
}

// ============================================================================
// PIX RECOVERY (get-pix-status response)
// ============================================================================

/**
 * Resposta da Edge Function get-pix-status
 * Usado para recuperação de página PIX sem accessToken
 */
export interface PixStatusResponse {
  success: boolean;
  pix_qr_code?: string | null;
  pix_status?: string | null;
  pix_id?: string | null;
  amount_cents?: number;
  order_status?: OrderStatus;
  checkout_slug?: string | null;
  error?: string;
}

// ============================================================================
// COUPON
// ============================================================================

export interface AppliedCoupon {
  id: string;
  code: string;
  name: string;
  discount_type: 'percentage';
  discount_value: number;
  apply_to_order_bumps: boolean;
}

// ============================================================================
// CARD PAYMENT
// ============================================================================

export interface CardPaymentData {
  token: string;
  installments: number;
  paymentMethodId?: string;
  issuerId?: string;
  holderDocument?: string;
}

// ============================================================================
// CREATE ORDER
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
  amount_cents?: number;
  error?: string;
  duplicate?: boolean;
}
