/**
 * Affiliate Credentials Types
 *
 * ARCHITECTURE DECISION (RISE V3 Solution D):
 * - Payout identifiers are stored in the `profiles` table (one per user)
 * - Affiliates inherit their profile's credentials (Single Source of Truth)
 * - The `affiliates.gateway_credentials` column is DEPRECATED
 * - Sensitive tokens (access_token, refresh_token) go to Vault
 *
 * @version 2.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Security & Modularization
 * @module kernel/types/affiliate/credentials
 */

// ============================================
// PROFILE-BASED CREDENTIALS (Single Source of Truth)
// ============================================

/**
 * PayoutIdentifiers - Non-sensitive IDs stored in profiles table
 * These are used for payment splits (NOT API keys or secrets)
 * 
 * Source: profiles.asaas_wallet_id, profiles.mercadopago_collector_id, etc.
 */
export interface PayoutIdentifiers {
  asaas_wallet_id: string | null;
  mercadopago_collector_id: string | null;
  stripe_account_id: string | null;
  pushinpay_account_id?: string | null;
}

// ============================================
// GATEWAY-SPECIFIC TYPE GUARDS
// ============================================

/**
 * Asaas payout identifier for split/receivement.
 * This is NOT an API key.
 */
export interface AsaasPayoutId {
  wallet_id: string;
}

/**
 * MercadoPago payout identifier for split/receivement.
 * This is NOT an access token.
 */
export interface MercadoPagoPayoutId {
  collector_id: string;
}

/**
 * Stripe payout identifier for split/receivement.
 * This is NOT a secret key.
 */
export interface StripePayoutId {
  account_id: string;
}

/**
 * PushinPay payout identifier (if applicable).
 */
export interface PushinPayPayoutId {
  account_id: string;
}

// ============================================
// DEPRECATED - Pending column removal
// ============================================

/**
 * GatewayCredentials
 * 
 * @deprecated Use PayoutIdentifiers from profiles table instead.
 * This type exists for database sync until affiliates.gateway_credentials column is dropped.
 */
export type GatewayCredentials = Partial<PayoutIdentifiers>;
