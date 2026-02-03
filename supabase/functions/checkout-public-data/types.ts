/**
 * Checkout Public Data - Shared Types
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Centralized type definitions for all handlers.
 * 
 * @module checkout-public-data/types
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// REQUEST TYPES
// ============================================================================

export type ActionType = 
  | "product" 
  | "offer" 
  | "order-bumps" 
  | "affiliate" 
  | "all" 
  | "validate-coupon" 
  | "get-checkout-offer" 
  | "checkout" 
  | "product-pixels" 
  | "order-by-token" 
  | "payment-link-data"
  | "resolve-and-load"
  | "resolve-universal"
  | "check-order-payment-status"
  | "get-checkout-slug-by-order";

export interface RequestBody {
  action: ActionType;
  productId?: string;
  checkoutId?: string;
  affiliateCode?: string;
  couponCode?: string;
  orderId?: string;
  token?: string;
  slug?: string;
}

// ============================================================================
// HANDLER CONTEXT
// ============================================================================

export interface HandlerContext {
  supabase: SupabaseClient;
  body: RequestBody;
  jsonResponse: (data: unknown, status?: number) => Response;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ProductData {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  support_name: string | null;
  required_fields: Record<string, boolean> | null;
  default_payment_method: string | null;
  upsell_settings: Record<string, unknown> | null;
  affiliate_settings: Record<string, unknown> | null;
  status: string | null;
  pix_gateway: string | null;
  credit_card_gateway: string | null;
}

export interface OfferData {
  offerId: string;
  offerName: string;
  offerPrice: number;
}

export interface OrderBumpFormatted {
  id: string;
  product_id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  call_to_action: string | null;
  product: Record<string, unknown> | null;
  offer: Record<string, unknown> | null;
}

export interface AffiliateData {
  affiliateId: string;
  affiliateCode: string;
  affiliateUserId: string;
  commissionRate: number | null;
  pixGateway?: string | null;
  creditCardGateway?: string | null;
}

/**
 * RISE V3: Checkout schema reflects SSOT architecture.
 * Individual color columns are DEPRECATED and not included.
 * All color data comes from the `design` JSON field.
 */
export interface CheckoutData {
  id: string;
  name: string;
  slug: string | null;
  visits_count: number;
  seller_name: string | null;
  font: string | null;
  components: unknown;
  top_components: unknown;
  bottom_components: unknown;
  design: unknown;
  theme: string | null;
  pix_gateway: string | null;
  credit_card_gateway: string | null;
  mercadopago_public_key: string | null;
  stripe_public_key: string | null;
}

export interface CouponData {
  id: string;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  apply_to_order_bumps: boolean;
}

export interface PixelData {
  id: string;
  platform: string;
  pixel_id: string;
  access_token: string | null;
  conversion_label: string | null;
  domain: string | null;
  is_active: boolean;
  fire_on_initiate_checkout: boolean;
  fire_on_purchase: boolean;
  fire_on_pix: boolean;
  fire_on_card: boolean;
  fire_on_boleto: boolean;
  custom_value_percent: number | null;
}
