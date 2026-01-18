/**
 * Affiliate Settings Types
 * 
 * Configuration types for affiliate programs.
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Modularization
 * @module kernel/types/affiliate/settings
 */

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
