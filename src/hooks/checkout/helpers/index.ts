/**
 * Checkout Data Helpers
 * 
 * Funções puras para buscar dados do checkout de forma modular
 */

export { fetchCheckoutById } from './fetchCheckoutById';
export type { CheckoutRawData } from './fetchCheckoutById';

export { fetchProductData } from './fetchProductData';
export type { ProductRawData } from './fetchProductData';

export { fetchOrderBumps } from './fetchOrderBumps';
export type { OrderBumpFormatted, OrderBumpRaw } from './fetchOrderBumps';

export { fetchAffiliateInfo, getAffiliateCode } from './fetchAffiliateInfo';
export type { AffiliateInfo } from './fetchAffiliateInfo';

export { fetchOfferData } from './fetchOfferData';
export type { OfferData } from './fetchOfferData';

export { resolveCheckoutSlug } from './resolveCheckoutSlug';
export type { SlugResolution } from './resolveCheckoutSlug';
