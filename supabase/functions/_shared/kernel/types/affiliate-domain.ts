/**
 * Affiliate Domain Types
 * 
 * Single Source of Truth for all affiliate-related interfaces.
 * Used by all affiliate Edge Functions.
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Interface Consolidation
 * @module kernel/types/affiliate-domain
 */

// ============================================
// CORE TYPES
// ============================================

/**
 * Possible affiliation statuses
 */
export type AffiliationStatus = 
  | "pending" 
  | "active" 
  | "rejected" 
  | "blocked" 
  | "cancelled";

/**
 * Supported payment gateway types for PIX
 */
export type PixGatewayType = 
  | "asaas" 
  | "mercadopago" 
  | "pushinpay"
  | null;

/**
 * Supported payment gateway types for Credit Card
 */
export type CreditCardGatewayType = 
  | "mercadopago" 
  | "stripe"
  | null;

// ============================================
// AFFILIATE SETTINGS
// ============================================

/**
 * Product-level affiliate program settings
 */
export interface AffiliateSettings {
  enabled?: boolean;
  requireApproval?: boolean;
  defaultRate?: number;
  maxRate?: number;
  minRate?: number;
  autoApprove?: boolean;
}

/**
 * Product-level gateway restrictions for affiliates
 */
export interface AffiliateGatewaySettings {
  pix_allowed?: string[];
  credit_card_allowed?: string[];
  require_gateway_connection?: boolean;
}

// ============================================
// AFFILIATE RECORDS
// ============================================

/**
 * Complete affiliation record from database
 */
export interface AffiliationRecord {
  id: string;
  affiliate_code: string;
  commission_rate: number | null;
  status: AffiliationStatus;
  total_sales_count: number | null;
  total_sales_amount: number | null;
  created_at: string;
  updated_at?: string;
  product_id: string;
  user_id: string;
  pix_gateway: PixGatewayType;
  credit_card_gateway: CreditCardGatewayType;
  gateway_credentials: GatewayCredentials | null;
}

/**
 * Minimal affiliation data for status checks
 */
export interface AffiliationStatusRecord {
  id: string;
  status: AffiliationStatus;
  affiliate_code: string | null;
}

/**
 * Affiliation data for list/summary views
 */
export interface AffiliationSummary {
  id: string;
  affiliate_code: string;
  commission_rate: number | null;
  status: AffiliationStatus;
  total_sales_count: number;
  total_sales_amount: number;
  created_at: string;
  product: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

// ============================================
// GATEWAY CREDENTIALS
// ============================================

/**
 * Stored gateway credentials for an affiliate
 */
export interface GatewayCredentials {
  asaas?: AsaasCredentials;
  mercadopago?: MercadoPagoCredentials;
  stripe?: StripeCredentials;
  pushinpay?: PushinPayCredentials;
}

export interface AsaasCredentials {
  wallet_id: string;
  api_key_encrypted?: string;
  environment?: "sandbox" | "production";
}

export interface MercadoPagoCredentials {
  collector_id: string;
  access_token_encrypted?: string;
}

export interface StripeCredentials {
  account_id: string;
  publishable_key?: string;
}

export interface PushinPayCredentials {
  api_key_encrypted?: string;
}

// ============================================
// AFFILIATE PIXELS
// ============================================

/**
 * Complete affiliate pixel record
 */
export interface AffiliatePixelRecord {
  id: string;
  affiliate_id: string;
  platform: PixelPlatform;
  pixel_id: string;
  enabled: boolean;
  domain?: string | null;
  fire_on_pix?: boolean;
  fire_on_card?: boolean;
  fire_on_boleto?: boolean;
  custom_value_pix?: number | null;
  custom_value_card?: number | null;
  custom_value_boleto?: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Supported pixel platforms
 */
export type PixelPlatform = 
  | "facebook" 
  | "google_ads" 
  | "tiktok" 
  | "taboola" 
  | "outbrain"
  | "kwai"
  | "pinterest"
  | "twitter";

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

// ============================================
// ACTION TYPES
// ============================================

/**
 * Actions available for affiliation management
 */
export type AffiliationManageAction = 
  | "approve" 
  | "reject" 
  | "block" 
  | "unblock" 
  | "update_commission";

/**
 * Actions available for affiliate self-service
 */
export type AffiliateSettingsAction = 
  | "update_gateways" 
  | "cancel";

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

/**
 * Request to create/update affiliation
 */
export interface AffiliationRequestInput {
  product_id: string;
}

/**
 * Response after affiliation request
 */
export interface AffiliationRequestOutput {
  success: boolean;
  affiliation_id?: string;
  status?: AffiliationStatus;
  requires_approval?: boolean;
  affiliate_code?: string;
  message?: string;
  error?: string;
}

/**
 * Request to manage an affiliation (producer side)
 */
export interface AffiliationManageInput {
  affiliation_id: string;
  action: AffiliationManageAction;
  commission_rate?: number;
}

/**
 * Complete affiliation details response
 */
export interface AffiliationDetailsOutput {
  affiliation: {
    id: string;
    affiliate_code: string;
    commission_rate: number;
    status: AffiliationStatus;
    total_sales_count: number;
    total_sales_amount: number;
    created_at: string;
    product: AffiliationProductRecord | null;
    offers: OfferWithPaymentLink[];
    checkouts: CheckoutWithPaymentLink[];
    producer: ProducerProfile | null;
    pixels: AffiliatePixelRecord[];
    pix_gateway: PixGatewayType;
    credit_card_gateway: CreditCardGatewayType;
    gateway_credentials: GatewayCredentials;
    allowed_gateways: {
      pix_allowed: string[];
      credit_card_allowed: string[];
      require_gateway_connection: boolean;
    };
  };
  otherProducts: MarketplaceProductSummary[];
}

// ============================================
// AUDIT LOG
// ============================================

/**
 * Affiliate audit log entry
 */
export interface AffiliateAuditLogEntry {
  affiliate_id: string;
  action: string;
  performed_by: string;
  previous_status: AffiliationStatus | null;
  new_status: AffiliationStatus;
  metadata?: Record<string, unknown>;
  ip_address?: string | null;
}
