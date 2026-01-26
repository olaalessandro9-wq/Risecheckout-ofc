/**
 * Entities Module - Shared handlers for product-related data
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * This module provides a Single Source of Truth for fetching
 * product entities across multiple Edge Functions.
 * 
 * Used by:
 * - product-full-loader (BFF)
 * - product-entities (individual entity fetching)
 * 
 * @module _shared/entities
 */

// Product
export { 
  fetchProduct,
  type UpsellSettings,
  type AffiliateSettings,
  type ProductResult,
} from "./product.ts";

// Offers
export { 
  fetchProductOffers, 
  fetchActiveProductOffers,
} from "./offers.ts";

// Order Bumps
export { 
  fetchProductOrderBumps,
  fetchProductOrderBumpsWithRelations,
} from "./orderBumps.ts";

// Checkouts
export { 
  fetchProductCheckouts, 
  fetchProductCheckoutsWithRelations,
} from "./checkouts.ts";

// Payment Links
export { 
  fetchProductPaymentLinks,
  fetchProductPaymentLinksWithRelations,
} from "./paymentLinks.ts";

// Coupons (per-product only)
export { 
  fetchProductCoupons,
} from "./coupons.ts";
