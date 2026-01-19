/**
 * Entities Module - Shared handlers for product-related data
 * 
 * This module provides a Single Source of Truth for fetching
 * product entities across multiple Edge Functions.
 * 
 * Used by:
 * - product-full-loader (BFF)
 * - product-entities (individual entity fetching)
 * 
 * @module _shared/entities
 * @version RISE V3 Compliant
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

// Coupons
export { 
  fetchProductCoupons, 
  fetchAllCoupons,
} from "./coupons.ts";
