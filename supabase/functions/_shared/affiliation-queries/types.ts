/**
 * Affiliation Queries - Types
 *
 * Type definitions for affiliation-related data structures.
 *
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - SRP & Modularization
 * @module _shared/affiliation-queries/types
 */

// ============================================
// CORE AFFILIATION TYPES
// ============================================

export interface AffiliationRecord {
  id: string;
  affiliate_code: string;
  commission_rate: number | null;
  status: string;
  total_sales_count: number | null;
  total_sales_amount: number | null;
  created_at: string;
  product_id: string;
  user_id: string;
  pix_gateway: string | null;
  credit_card_gateway: string | null;
  gateway_credentials: Record<string, unknown> | null;
}

export interface AffiliateSettings {
  defaultRate?: number;
  [key: string]: unknown;
}

export interface GatewaySettings {
  pix_allowed?: string[];
  credit_card_allowed?: string[];
  require_gateway_connection?: boolean;
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface ProductRecord {
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
  affiliate_gateway_settings: GatewaySettings | null;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  commission_percentage: number | null;
}

// ============================================
// PAYMENT & CHECKOUT TYPES
// ============================================

export interface PaymentLinkRecord {
  id: string;
  slug: string;
  status: string;
}

export interface OfferRecord {
  id: string;
  name: string;
  price: number;
  status: string;
  is_default: boolean;
  payment_links: PaymentLinkRecord[] | null;
}

export interface CheckoutLinkData {
  payment_links?: { slug: string } | Array<{ slug: string }>;
}

export interface CheckoutRecord {
  id: string;
  slug: string;
  is_default: boolean;
  status: string;
  checkout_links?: CheckoutLinkData[];
}

// ============================================
// PROFILE & PIXEL TYPES
// ============================================

export interface ProducerRecord {
  id: string;
  name: string | null;
}

export interface AffiliatePixel {
  id: string;
  affiliate_id: string;
  platform: string;
  pixel_id: string;
  enabled: boolean;
  [key: string]: unknown;
}
