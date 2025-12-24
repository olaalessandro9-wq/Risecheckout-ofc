/**
 * Asaas Gateway Types
 * 
 * Tipos específicos para integração com o gateway Asaas.
 * Suporta apenas PIX e Cartão de Crédito.
 */

// ============================================
// ENVIRONMENT
// ============================================

export type AsaasEnvironment = 'sandbox' | 'production';

// ============================================
// CREDENTIALS
// ============================================

export interface AsaasCredentials {
  api_key: string;
  environment: AsaasEnvironment;
}

export interface AsaasConfig {
  apiKey: string;
  environment: AsaasEnvironment;
  isConfigured: boolean;
  walletId?: string;
  accountName?: string;
}

// ============================================
// CUSTOMER
// ============================================

export interface AsaasCustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

// ============================================
// PAYMENT REQUEST
// ============================================

export interface AsaasPaymentRequest {
  vendorId: string;
  amountCents: number;
  description: string;
  customer: AsaasCustomerData;
  paymentMethod: 'pix' | 'credit_card';
  orderId?: string;
  // Campos específicos para cartão
  cardToken?: string;
  installments?: number;
}

// ============================================
// PAYMENT RESPONSE
// ============================================

export interface AsaasPaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: 'pending' | 'approved' | 'refused' | 'processing';
  // Campos PIX
  qrCode?: string;
  qrCodeText?: string;
  pixId?: string;
  // Erro
  errorMessage?: string;
}

// ============================================
// VALIDATION
// ============================================

export interface AsaasValidationResult {
  valid: boolean;
  message?: string;
  accountName?: string;
  walletId?: string;
}

// ============================================
// INTEGRATION CONFIG (para vendor_integrations)
// ============================================

export interface AsaasIntegrationConfig {
  api_key: string;
  environment: AsaasEnvironment;
  wallet_id?: string;
  validated_at?: string;
  account_name?: string;
}
