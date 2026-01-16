/**
 * API Endpoints - Public Exports
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * Re-exports all endpoint modules for convenient importing.
 * 
 * Usage:
 * ```typescript
 * import { productsApi, analyticsApi } from "@/lib/api/endpoints";
 * ```
 */

export { productsApi } from "./products";
export type {
  Product,
  ProductSettings,
  CreateProductInput,
  UpdateProductInput,
} from "./products";

export { analyticsApi } from "./analytics";
export type {
  DashboardAnalytics,
  SalesDataPoint,
  TopProduct,
  AnalyticsPeriod,
  DashboardData,
} from "./analytics";

// Future endpoints will be added here:
// export { offersApi } from "./offers";
// export { checkoutsApi } from "./checkouts";
// export { affiliationsApi } from "./affiliations";
// export { marketplaceApi } from "./marketplace";
// export { settingsApi } from "./settings";
