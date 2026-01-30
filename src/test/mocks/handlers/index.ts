/**
 * MSW Handlers Barrel Export
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Centralized export for all MSW handlers.
 * Organized by domain for maintainability.
 * 
 * @module test/mocks/handlers
 */

// Domain-specific handlers
export { analyticsHandlers, mockDashboardData, mockSalesChartData, mockProductAnalyticsData } from "./analytics-handlers";
export { productsHandlers, mockProducts, mockProductSettings } from "./products-handlers";
export { 
  checkoutPublicHandlers, 
  mockPublicProduct, 
  mockPublicCheckout, 
  mockOrderBumps,
  mockAffiliateInfo,
  mockResolveSlugResponse,
} from "./checkout-public-handlers";
export { trackVisitHandlers, mockTrackVisitResponse } from "./track-visit-handlers";
export { 
  marketplaceHandlers, 
  mockMarketplaceProducts, 
  mockMarketplaceCategories,
  mockAffiliationStatusResponse,
} from "./marketplace-handlers";
export { 
  offersHandlers, 
  mockOffers, 
  mockOffersWithNulls,
} from "./offers-handlers";

// Combined handlers array for easy import
import { analyticsHandlers } from "./analytics-handlers";
import { productsHandlers } from "./products-handlers";
import { checkoutPublicHandlers } from "./checkout-public-handlers";
import { trackVisitHandlers } from "./track-visit-handlers";
import { marketplaceHandlers } from "./marketplace-handlers";
import { offersHandlers } from "./offers-handlers";

export const domainHandlers = [
  ...analyticsHandlers,
  ...productsHandlers,
  ...checkoutPublicHandlers,
  ...trackVisitHandlers,
  ...marketplaceHandlers,
  ...offersHandlers,
];
