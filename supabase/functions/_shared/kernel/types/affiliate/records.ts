/**
 * Affiliate Record Types
 * 
 * Database record types for affiliations.
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Modularization
 * @module kernel/types/affiliate/records
 */

import type { AffiliationStatus, PixGatewayType, CreditCardGatewayType } from "./core.ts";
import type { GatewayCredentials } from "./credentials.ts";

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
