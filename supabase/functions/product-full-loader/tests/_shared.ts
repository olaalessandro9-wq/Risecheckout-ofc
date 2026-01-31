/**
 * Shared Types & Mock Data for product-full-loader Tests
 * 
 * @module product-full-loader/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ProductFullRequest {
  action: string;
  productId: string;
}

export interface ProductFullResponse {
  success: boolean;
  data?: {
    product: ProductData | null;
    upsellSettings: UpsellSettings | null;
    affiliateSettings: AffiliateSettings | null;
    offers: unknown[];
    orderBumps: unknown[];
    checkouts: unknown[];
    paymentLinks: unknown[];
    coupons: unknown[];
  };
  error?: string;
}

export interface ProductData {
  id: string;
  name: string;
  price: number;
  user_id: string;
  status: string;
}

export interface UpsellSettings {
  enabled: boolean;
  upsell_product_id: string | null;
  discount_percentage: number | null;
}

export interface AffiliateSettings {
  is_affiliate_enabled: boolean;
  commission_rate: number | null;
  cookie_days: number | null;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_VENDOR_ID = "vendor-uuid-123";
export const MOCK_PRODUCT_ID = "product-uuid-456";

export const MOCK_PRODUCT: ProductData = {
  id: MOCK_PRODUCT_ID,
  name: "Test Product",
  price: 99.99,
  user_id: MOCK_VENDOR_ID,
  status: "active",
};

export const MOCK_UPSELL_SETTINGS: UpsellSettings = {
  enabled: true,
  upsell_product_id: "upsell-product-uuid",
  discount_percentage: 20,
};

export const MOCK_AFFILIATE_SETTINGS: AffiliateSettings = {
  is_affiliate_enabled: true,
  commission_rate: 30,
  cookie_days: 30,
};

export const MOCK_VALID_REQUEST: ProductFullRequest = {
  action: "load-full",
  productId: MOCK_PRODUCT_ID,
};

export const MOCK_INVALID_ACTION_REQUEST: ProductFullRequest = {
  action: "invalid-action",
  productId: MOCK_PRODUCT_ID,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function validateRequest(request: ProductFullRequest): string | null {
  if (request.action !== "load-full") {
    return "Invalid action";
  }
  if (!request.productId) {
    return "productId is required";
  }
  return null;
}

export function buildFullResponse(
  product: ProductData | null,
  upsellSettings: UpsellSettings | null,
  affiliateSettings: AffiliateSettings | null
): ProductFullResponse {
  return {
    success: true,
    data: {
      product,
      upsellSettings,
      affiliateSettings,
      offers: [],
      orderBumps: [],
      checkouts: [],
      paymentLinks: [],
      coupons: [],
    },
  };
}
