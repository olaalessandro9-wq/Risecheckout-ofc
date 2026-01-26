/**
 * API Module - Public Exports
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * This is the main entry point for the API layer.
 * Import everything from here:
 * 
 * ```typescript
 * // For authenticated calls
 * import { api, ApiResponse, ApiError, isAuthError } from "@/lib/api";
 * 
 * // For public calls (checkout, payment links, etc.)
 * import { publicApi } from "@/lib/api";
 * 
 * // Domain-specific APIs
 * import { productsApi, analyticsApi } from "@/lib/api";
 * ```
 */

// Main client (authenticated)
export { api } from "./client";
export type { ApiCallOptions } from "./client";

// Public client (isolated from auth - for checkout, etc.)
export { publicApi } from "./public-client";
export type { PublicApiCallOptions } from "./public-client";

// Types
export type {
  ApiResponse,
  ApiError,
  ApiErrorCode,
  PaginatedResponse,
  MutationResponse,
  PaginationParams,
  SortParams,
  ListParams,
  ProducerContext,
  CrudAction,
  CrudRequest,
} from "./types";

// Error utilities
export {
  createApiError,
  parseHttpError,
  parseNetworkError,
  getErrorMessage,
  getDisplayMessage,
  isAuthError,
  isRetryableError,
} from "./errors";

// Endpoint modules
export { productsApi } from "./endpoints/products";
export type {
  Product,
  ProductSettings,
  CreateProductInput,
  UpdateProductInput,
} from "./endpoints/products";

export { analyticsApi } from "./endpoints/analytics";
export type {
  DashboardAnalytics,
  SalesDataPoint,
  TopProduct,
  AnalyticsPeriod,
  DashboardData,
} from "./endpoints/analytics";
