/**
 * Tipos para Pixel Management
 * 
 * RISE V3: Response helper imported from response-helpers.ts
 */

// Re-export jsonResponse for backwards compatibility
export { jsonResponse } from "./response-helpers.ts";

// ============================================================================
// Request Types
// ============================================================================

export type PixelAction = 
  | "list" 
  | "create" 
  | "update" 
  | "delete" 
  | "link-to-product" 
  | "unlink-from-product" 
  | "update-product-link" 
  | "list-product-links";

export interface PixelData {
  platform?: string;
  name?: string;
  pixel_id?: string;
  access_token?: string | null;
  conversion_label?: string | null;
  domain?: string | null;
  is_active?: boolean;
  // Link settings
  fire_on_initiate_checkout?: boolean;
  fire_on_purchase?: boolean;
  fire_on_pix?: boolean;
  fire_on_card?: boolean;
  fire_on_boleto?: boolean;
  custom_value_percent?: number | null;
}

export interface RequestBody {
  action: PixelAction;
  pixelId?: string;
  productId?: string;
  data?: PixelData;
}

// ============================================================================
// Database Record Types
// ============================================================================

export interface RateLimitRecord {
  id: string;
  blocked_until: string | null;
  first_attempt_at: string;
  last_attempt_at: string;
  attempts: number;
}

export interface SessionRecord {
  user_id: string;
  expires_at: string;
  is_valid: boolean;
}

export interface PixelRecord {
  id: string;
  vendor_id: string;
  platform: string;
  name: string;
  pixel_id: string;
  access_token: string | null;
  conversion_label: string | null;
  domain: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPixelLink {
  id: string;
  product_id: string;
  pixel_id: string;
  fire_on_initiate_checkout: boolean;
  fire_on_purchase: boolean;
  fire_on_pix: boolean;
  fire_on_card: boolean;
  fire_on_boleto: boolean;
  custom_value_percent: number | null;
  created_at: string;
}
