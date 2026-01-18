/**
 * Affiliate Product Types
 * 
 * Types for product, offer, checkout and producer data.
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Modularization
 * @module kernel/types/affiliate/product
 */

import type { AffiliateSettings, AffiliateGatewaySettings } from "./settings.ts";

// ============================================
// PRODUCT DATA
// ============================================

/**
 * Product data for affiliation context
 */
export interface AffiliationProductRecord {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  marketplace_description: string | null;
  marketplace_rules: string | null;
  marketplace_category: string | null;
  user_id: string;
  affiliate_settings: AffiliateSettings | null;
  affiliate_gateway_settings: AffiliateGatewaySettings | null;
}

/**
 * Minimal product data for ownership validation
 */
export interface ProductOwnerRecord {
  id: string;
  user_id: string;
  name?: string;
}

// ============================================
// OFFER DATA
// ============================================

/**
 * Offer with payment link information
 */
export interface OfferWithPaymentLink {
  id: string;
  name: string;
  price: number;
  status: string;
  is_default: boolean;
  payment_link_slug: string | null;
}

/**
 * Payment link record
 */
export interface PaymentLinkRecord {
  id: string;
  slug: string;
  status: string;
}

// ============================================
// CHECKOUT DATA
// ============================================

/**
 * Checkout with payment link information
 */
export interface CheckoutWithPaymentLink {
  id: string;
  slug: string;
  status: string;
  is_default: boolean;
  payment_link_slug: string | null;
}

// ============================================
// PRODUCER DATA
// ============================================

/**
 * Producer profile for affiliation context
 */
export interface ProducerProfile {
  id: string;
  name: string | null;
  asaas_wallet_id?: string | null;
  mercadopago_collector_id?: string | null;
  stripe_account_id?: string | null;
}

// ============================================
// MARKETPLACE DATA
// ============================================

/**
 * Marketplace product for recommendations
 */
export interface MarketplaceProductSummary {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  commission_percentage: number | null;
}
