/**
 * Affiliate Action Types
 * 
 * Types for affiliation management actions and requests/responses.
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Modularization
 * @module kernel/types/affiliate/actions
 */

import type { AffiliationStatus, PixGatewayType, CreditCardGatewayType } from "./core.ts";
import type { GatewayCredentials } from "./credentials.ts";
import type { AffiliationProductRecord, OfferWithPaymentLink, CheckoutWithPaymentLink, ProducerProfile, MarketplaceProductSummary } from "./product.ts";
import type { AffiliatePixelRecord } from "./pixels.ts";

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
