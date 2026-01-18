/**
 * Affiliate Credentials Types
 *
 * IMPORTANT SECURITY CONTRACT:
 * This module defines ONLY non-sensitive payout identifiers for affiliates
 * (e.g., wallet_id / collector_id / stripe account_id).
 *
 * It MUST NOT contain API keys, access tokens, client secrets, or any other secrets.
 * Sensitive credentials belong to Vault (RPC: save_gateway_credentials/get_gateway_credentials)
 * and/or Supabase Edge Function Secrets.
 *
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Security & Modularization
 * @module kernel/types/affiliate/credentials
 */

// ============================================
// GATEWAY-SPECIFIC (NON-SENSITIVE) IDENTIFIERS
// ============================================

/**
 * Asaas payout identifier for split/receivement.
 * This is NOT an API key.
 */
export interface AsaasCredentials {
  wallet_id: string;
}

/**
 * MercadoPago payout identifier for split/receivement.
 * This is NOT an access token.
 */
export interface MercadoPagoCredentials {
  collector_id: string;
}

/**
 * Stripe payout identifier for split/receivement.
 * This is NOT a secret key.
 */
export interface StripeCredentials {
  account_id: string;
}

/**
 * PushinPay payout identifier (if applicable).
 * If PushinPay split doesn't require a recipient id, keep optional.
 */
export interface PushinPayCredentials {
  recipient_id?: string;
}

// ============================================
// STORAGE SHAPE (AFFILIATES.gateway_credentials JSONB)
// ============================================

/**
 * GatewayCredentials
 *
 * Represents the JSON stored in affiliates.gateway_credentials (jsonb).
 * The database may contain additional keys; we allow them via Record<string, unknown>.
 *
 * Current codebase uses flat keys in some places (e.g., asaas_wallet_id).
 * We model them explicitly to avoid "any" and preserve a stable contract.
 */
export type GatewayCredentials = {
  // Flat legacy/DB-friendly keys (observed in current code):
  asaas_wallet_id?: string;
  mercadopago_collector_id?: string;
  stripe_account_id?: string;
  pushinpay_recipient_id?: string;

  // Optional canonical keys (future-proof, still non-sensitive):
  asaas?: Partial<AsaasCredentials>;
  mercadopago?: Partial<MercadoPagoCredentials>;
  stripe?: Partial<StripeCredentials>;
  pushinpay?: Partial<PushinPayCredentials>;
} & Record<string, unknown>;
