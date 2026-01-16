/**
 * API Types - Unified Type Definitions
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * This module contains all shared type definitions for the API layer.
 * All Edge Function responses MUST conform to these types.
 */

// ============================================
// ERROR TYPES
// ============================================

/**
 * Standard error codes used across all Edge Functions
 */
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNKNOWN";

/**
 * Standard API error structure
 */
export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Standard API response wrapper
 * All Edge Functions MUST return this structure
 */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Standard success response for mutations
 */
export interface MutationResponse {
  success: boolean;
  id?: string;
  message?: string;
}

// ============================================
// REQUEST TYPES
// ============================================

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Standard sort parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Combined query parameters for list endpoints
 */
export interface ListParams extends PaginationParams, SortParams {
  search?: string;
  filters?: Record<string, unknown>;
}

// ============================================
// DOMAIN TYPES (Producer/User)
// ============================================

/**
 * Authenticated producer context
 * Returned by session validation
 */
export interface ProducerContext {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

// ============================================
// ACTION TYPES (for CRUD Edge Functions)
// ============================================

/**
 * Standard CRUD actions
 */
export type CrudAction = "list" | "get" | "create" | "update" | "delete";

/**
 * Base request body for CRUD Edge Functions
 */
export interface CrudRequest<TAction extends string = CrudAction, TParams = unknown> {
  action: TAction;
  params?: TParams;
}
