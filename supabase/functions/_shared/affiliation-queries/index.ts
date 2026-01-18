/**
 * Affiliation Queries - Barrel Export
 *
 * Central export point for all affiliation query functions and types.
 *
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - SRP & Modularization
 * @module _shared/affiliation-queries
 */

// Re-export all query functions
export {
  fetchAffiliationWithValidation,
  fetchProductData,
  fetchOffers,
  fetchCheckouts,
  fetchPixels,
  fetchProducerProfile,
  fetchOtherProducts,
} from "./queries.ts";

// Re-export all mapper functions
export {
  mapOffersWithPaymentSlug,
  mapCheckoutsWithPaymentSlug,
  extractGatewaySettings,
} from "./mappers.ts";

// Re-export all types
export type {
  AffiliationRecord,
  AffiliateSettings,
  GatewaySettings,
  ProductRecord,
  MarketplaceProduct,
  PaymentLinkRecord,
  OfferRecord,
  CheckoutLinkData,
  CheckoutRecord,
  ProducerRecord,
  AffiliatePixel,
} from "./types.ts";
