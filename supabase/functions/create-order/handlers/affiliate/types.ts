/**
 * Affiliate Processor - Types
 *
 * Type definitions for affiliate processing and split calculation.
 *
 * @version 2.0.0 - RISE Protocol V3 Compliance
 * @module create-order/handlers/affiliate/types
 */

import type { OrderItem } from "../bump-processor.ts";

// ============================================
// SPLIT & RESULT TYPES
// ============================================

export interface SplitData {
  platformFeeCents: number;
  affiliateWalletId: string | null;
  affiliateCommissionCents: number;
}

export interface AffiliateResult {
  affiliateId: string | null;
  commissionCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  affiliateWalletId: string | null;
  splitData: SplitData;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface AffiliateSettings {
  enabled?: boolean;
  defaultRate?: number;
  requireApproval?: boolean;
  commissionOnOrderBump?: boolean;
  commissionOnUpsell?: boolean;
  allowUpsells?: boolean;
}

export interface ProductInput {
  user_id: string;
  affiliate_settings: AffiliateSettings | Record<string, unknown>;
}

export interface AffiliateInput {
  product: ProductInput;
  product_id: string;
  affiliate_code?: string;
  customer_email: string;
  amountInCents: number;
  discountAmount: number;
  totalAmount: number;
  allOrderItems: OrderItem[];
}

// ============================================
// DATABASE RECORD TYPES
// ============================================

export interface AffiliateProfile {
  asaas_wallet_id: string | null;
  mercadopago_collector_id: string | null;
  stripe_account_id: string | null;
}

export interface AffiliateRecord {
  id: string;
  user_id: string;
  commission_rate: number | null;
  status: string;
  pix_gateway: string | null;
  credit_card_gateway: string | null;
  gateway_credentials: Record<string, string> | null;
  /** User record with payout identifiers (SSOT: users table) */
  user: AffiliateProfile | null;
}

export interface AffiliateUserData {
  user?: {
    email?: string;
  };
}

// ============================================
// CONSTANTS
// ============================================

/** Maximum allowed commission rate (security limit) */
export const MAX_COMMISSION_RATE = 90;
