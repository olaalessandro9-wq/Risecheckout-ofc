/**
 * API Module - Public Exports
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * This is the main entry point for the API layer.
 * Import everything from here:
 * 
 * ```typescript
 * import { api, ApiResponse, ApiError, isAuthError } from "@/lib/api";
 * import { productsApi, analyticsApi } from "@/lib/api";
 * ```
 */

// Main client
export { api } from "./client";
export type { ApiCallOptions } from "./client";

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
