/**
 * Affiliate Pixel Types
 * 
 * Types for tracking pixels configuration.
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Modularization
 * @module kernel/types/affiliate/pixels
 */

// ============================================
// PIXEL PLATFORMS
// ============================================

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
// PIXEL RECORDS
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
