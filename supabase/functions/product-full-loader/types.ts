/**
 * Types for Product Full Loader BFF
 * 
 * @module product-full-loader/types
 * @version RISE V3 Compliant
 */

export interface ProductFullRequest {
  action: "load-full";
  productId: string;
}

export interface UpsellSettings {
  upsell_enabled: boolean;
  upsell_product_id: string | null;
  upsell_offer_id: string | null;
  upsell_checkout_id: string | null;
  upsell_timer_enabled: boolean;
  upsell_timer_minutes: number;
  upsell_custom_page_url: string | null;
}

export interface AffiliateSettings {
  affiliate_enabled: boolean;
  affiliate_commission_type: string;
  affiliate_commission_value: number;
  affiliate_cookie_days: number;
  affiliate_approval_mode: string;
  affiliate_allow_coupon: boolean;
  affiliate_public_in_marketplace: boolean;
}

export interface OfferRecord {
  id: string;
  product_id: string;
  name: string;
  price: number;
  original_price: number | null;
  billing_type: string;
  billing_cycle: string | null;
  billing_cycles_count: number | null;
  is_default: boolean;
  active: boolean;
  grant_member_group_ids: string[] | null;
  created_at: string;
  updated_at: string | null;
}

export interface OrderBumpRecord {
  id: string;
  product_id: string;
  bump_product_id: string;
  bump_offer_id: string;
  title: string;
  description: string | null;
  call_to_action: string;
  display_price: number;
  special_price: number;
  position: number;
  active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface CheckoutRecord {
  id: string;
  product_id: string;
  name: string;
  slug: string | null;
  is_default: boolean;
  status: string | null;
  theme: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface PaymentLinkRecord {
  id: string;
  checkout_id: string;
  offer_id: string;
  slug: string;
  active: boolean;
  created_at: string;
}

export interface CouponRecord {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  uses_count: number | null;
  expires_at: string | null;
  start_date: string | null;
  active: boolean;
  apply_to_order_bumps: boolean | null;
  created_at: string;
}

export interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  status: string;
  vendor_id: string;
  
  // Support Fields
  support_email: string | null;
  support_name: string | null;
  
  // Marketplace Fields
  marketplace_description: string | null;
  marketplace_category: string | null;
  
  // Upsell Settings
  upsell_enabled: boolean;
  upsell_product_id: string | null;
  upsell_offer_id: string | null;
  upsell_checkout_id: string | null;
  upsell_timer_enabled: boolean;
  upsell_timer_minutes: number;
  upsell_settings: Record<string, unknown> | null;
  
  // Affiliate Settings
  affiliate_enabled: boolean;
  affiliate_commission_type: string;
  affiliate_commission_value: number;
  affiliate_cookie_days: number;
  affiliate_approval_mode: string;
  affiliate_allow_coupon: boolean;
  affiliate_public_in_marketplace: boolean;
  
  // Members Area
  members_area_enabled: boolean;
  
  created_at: string;
  updated_at: string | null;
}

export interface ProductFullResponse {
  product: ProductRecord;
  upsellSettings: UpsellSettings;
  affiliateSettings: AffiliateSettings;
  offers: OfferRecord[];
  orderBumps: OrderBumpRecord[];
  checkouts: CheckoutRecord[];
  paymentLinks: PaymentLinkRecord[];
  coupons: CouponRecord[];
}
