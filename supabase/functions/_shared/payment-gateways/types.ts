/**
 * Tipos para o sistema de pagamentos (Backend Edge Functions)
 * 
 * Segue convenção snake_case para compatibilidade com APIs externas.
 * Mapeia para tipos camelCase do frontend quando necessário.
 */

// ============================================
// PAYMENT STATUS & METHODS
// ============================================

export type PaymentStatus = 
  | 'pending'
  | 'approved'
  | 'refused'
  | 'error'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'debit_card';

export type GatewayId = 
  | 'mercadopago' 
  | 'pushinpay'
  | 'stripe' 
  | 'pagseguro'
  | 'asaas';

// ============================================
// SPLIT PAYMENT
// ============================================

export interface PaymentSplitRule {
  recipient_id?: string;
  recipient_email?: string;
  amount_cents: number;
  role: 'platform' | 'affiliate' | 'producer';
  liable?: boolean;
}

// ============================================
// CUSTOMER DATA
// ============================================

export interface CustomerData {
  name: string;
  email: string;
  document?: string;
  phone?: string;
}

// ============================================
// PAYMENT REQUEST/RESPONSE
// ============================================

export interface PaymentRequest {
  amount_cents: number;
  customer: CustomerData;
  order_id: string;
  description: string;
  card_token?: string;
  installments?: number;
  split_rules?: PaymentSplitRule[];
}

export interface PaymentResponse {
  success: boolean;
  transaction_id: string;
  status: PaymentStatus;
  qr_code?: string;
  qr_code_text?: string;
  raw_response?: unknown;
  error_message?: string;
}

// ============================================
// PIX SPECIFIC
// ============================================

export interface PixPaymentData {
  qr_code: string;
  qr_code_text: string;
  expires_at?: string;
  transaction_id: string;
}

// ============================================
// GATEWAY CREDENTIALS
// ============================================

export interface GatewayCredentials {
  access_token?: string;
  public_key?: string;
  secret_key?: string;
  token?: string;
  api_key?: string;  // Asaas
  environment?: 'sandbox' | 'production';
  [key: string]: unknown;
}

// ============================================
// GATEWAY INTERFACE (Abstract)
// ============================================

export interface IPaymentGateway {
  id: GatewayId;
  display_name: string;
  
  initialize?(credentials: GatewayCredentials): Promise<void>;
  create_pix_payment?(request: PaymentRequest): Promise<PixPaymentData>;
  create_card_payment?(request: PaymentRequest): Promise<PaymentResponse>;
  get_payment_status?(transaction_id: string): Promise<PaymentStatus>;
}

// ============================================
// UTILITY: Convert between Frontend/Backend
// ============================================

/**
 * Converte PaymentRequest do frontend (camelCase) para backend (snake_case)
 */
export function fromFrontendRequest(frontendRequest: {
  amountCents: number;
  customer: CustomerData;
  orderId: string;
  description: string;
  cardToken?: string;
  installments?: number;
  splitRules?: Array<{
    recipientId?: string;
    recipientEmail?: string;
    amountCents: number;
    role: 'platform' | 'affiliate' | 'producer';
    liable?: boolean;
  }>;
}): PaymentRequest {
  return {
    amount_cents: frontendRequest.amountCents,
    customer: frontendRequest.customer,
    order_id: frontendRequest.orderId,
    description: frontendRequest.description,
    card_token: frontendRequest.cardToken,
    installments: frontendRequest.installments,
    split_rules: frontendRequest.splitRules?.map(rule => ({
      recipient_id: rule.recipientId,
      recipient_email: rule.recipientEmail,
      amount_cents: rule.amountCents,
      role: rule.role,
      liable: rule.liable,
    })),
  };
}

/**
 * Converte PaymentResponse do backend (snake_case) para frontend (camelCase)
 */
export function toFrontendResponse(backendResponse: PaymentResponse): {
  success: boolean;
  transactionId: string;
  status: PaymentStatus;
  qrCode?: string;
  qrCodeText?: string;
  rawResponse?: unknown;
  errorMessage?: string;
} {
  return {
    success: backendResponse.success,
    transactionId: backendResponse.transaction_id,
    status: backendResponse.status,
    qrCode: backendResponse.qr_code,
    qrCodeText: backendResponse.qr_code_text,
    rawResponse: backendResponse.raw_response,
    errorMessage: backendResponse.error_message,
  };
}
