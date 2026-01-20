/**
 * Stripe Gateway Types
 * 
 * @module integrations/gateways/stripe
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Tipos específicos para integração com o gateway Stripe.
 * Suporta Cartão de Crédito, PIX e Débito via Stripe Connect.
 */

// ============================================
// ENVIRONMENT
// ============================================

/**
 * Ambiente do Stripe (livemode vs test)
 * Stripe não tem sandbox explícito - usa livemode true/false
 */
export type StripeEnvironment = 'test' | 'production';

// ============================================
// CONNECTION STATUS
// ============================================

/**
 * Status de conexão do Stripe Connect
 */
export interface StripeConnectionStatus {
  connected: boolean;
  account_id: string | null;
  email: string | null;
  livemode: boolean | null;
  connected_at: string | null;
}

/**
 * Configuração do Stripe para um vendor
 */
export interface StripeConfig {
  accountId: string;
  email: string | null;
  livemode: boolean;
  connectedAt: string | null;
  isConfigured: boolean;
}

// ============================================
// API RESPONSES
// ============================================

/**
 * Resposta da Edge Function stripe-connect-oauth
 */
export interface StripeConnectResponse {
  success?: boolean;
  connected?: boolean;
  account_id?: string | null;
  email?: string | null;
  livemode?: boolean | null;
  connected_at?: string | null;
  url?: string;
  error?: string;
}

// ============================================
// ACTIONS
// ============================================

/**
 * Ações disponíveis na Edge Function stripe-connect-oauth
 */
export type StripeConnectAction = 'status' | 'start' | 'disconnect';

// ============================================
// PAYMENT
// ============================================

/**
 * Dados do cliente para pagamento Stripe
 */
export interface StripeCustomerData {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
}

/**
 * Request para criar pagamento Stripe
 */
export interface StripePaymentRequest {
  vendorId: string;
  amountCents: number;
  description: string;
  customer: StripeCustomerData;
  paymentMethod: 'credit_card' | 'pix' | 'debit_card';
  cardToken?: string;
  installments?: number;
  orderId?: string;
}

/**
 * Resposta de pagamento Stripe
 */
export interface StripePaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: 'pending' | 'approved' | 'refused' | 'processing';
  clientSecret?: string;
  pixQrCode?: string;
  pixQrCodeText?: string;
  errorMessage?: string;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Resultado de validação de conexão Stripe
 */
export interface StripeValidationResult {
  valid: boolean;
  message?: string;
  accountId?: string;
  email?: string;
}

// ============================================
// INTEGRATION CONFIG (para vendor_integrations)
// ============================================

/**
 * Configuração salva na tabela vendor_integrations
 */
export interface StripeIntegrationConfig {
  account_id: string;
  livemode: boolean;
  email?: string;
  connected_at?: string;
}
