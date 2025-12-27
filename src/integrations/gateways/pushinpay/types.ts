/**
 * Types para o PushinPay Gateway
 * Módulo: src/integrations/gateways/pushinpay
 * 
 * Este arquivo contém todas as interfaces TypeScript para
 * o gateway de pagamento PIX da PushinPay.
 */

/**
 * Ambiente da PushinPay
 */
export type PushinPayEnvironment = "sandbox" | "production";

/**
 * Configurações da PushinPay
 */
export interface PushinPaySettings {
  pushinpay_token: string;
  pushinpay_account_id?: string;
  environment: PushinPayEnvironment;
}

/**
 * Integração da PushinPay no banco de dados
 */
export interface PushinPayIntegration {
  id: string;
  vendor_id: string;
  integration_type: "PUSHINPAY";
  active: boolean;
  config: {
    pushinpay_token: string;
    environment: PushinPayEnvironment;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Resposta da criação de cobrança PIX
 */
export interface PixChargeResponse {
  ok: boolean;
  pix?: {
    id: string;
    pix_id: string;
    qr_code: string;
    qr_code_base64: string;
    status: string;
    value: number;
  };
  error?: string;
}

/**
 * Status do pagamento PIX
 */
export type PixPaymentStatus = "created" | "paid" | "expired" | "canceled";

/**
 * Resposta da consulta de status PIX
 */
export interface PixStatusResponse {
  ok: boolean;
  status?: {
    status: PixPaymentStatus;
    value: number;
    end_to_end_id?: string | null;
    payer_name?: string | null;
    payer_national_registration?: string | null;
  };
  error?: string;
}

/**
 * Resposta do teste de conexão
 */
export interface PushinPayConnectionTestResponse {
  ok: boolean;
  environment: PushinPayEnvironment;
  message: string;
  details?: {
    apiVersion?: string;
    accountId?: string;
    permissions?: string[];
  };
}

/**
 * Estatísticas de uso da PushinPay
 */
export interface PushinPayStats {
  lastTransaction?: string;
  totalTransactions: number;
  totalAmount: number;
  webhookStatus: "configured" | "not_configured" | "unknown";
}

/**
 * Informações da conta PushinPay retornadas pela API
 * Endpoint: GET /accounts/find
 */
export interface PushinPayAccountInfo {
  id: string;       // Account ID para usar em splits
  name: string;     // Nome da conta
  email: string;    // Email da conta
}
