/**
 * Products API Endpoint
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * This module provides typed functions for all product-related operations.
 * All functions use the unified API client - NO direct database access.
 * 
 * Usage:
 * ```typescript
 * import { productsApi } from "@/lib/api/endpoints/products";
 * 
 * const { data, error } = await productsApi.list({ page: 1 });
 * const { data, error } = await productsApi.get("product-id");
 * ```
 */

import { api } from "../client";
import type { ApiResponse, PaginatedResponse, MutationResponse, ListParams } from "../types";

// ============================================
// TYPES
// ============================================

/**
 * Product entity
 */
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  status: "active" | "inactive" | "draft";
  image_url: string | null;
  slug: string | null;
  vendor_id: string;
  created_at: string;
  updated_at: string;
  // Additional fields
  delivery_type?: string;
  support_email?: string;
  support_phone?: string;
  marketplace_enabled?: boolean;
  marketplace_commission_rate?: number;
}

/**
 * Product settings
 */
export interface ProductSettings {
  product_id: string;
  marketplace_enabled: boolean;
  marketplace_commission_rate: number;
  affiliate_enabled: boolean;
  affiliate_commission_rate: number;
  // Add more settings as needed
}

/**
 * Create product input
 */
export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  status?: "active" | "inactive" | "draft";
  image_url?: string;
  slug?: string;
  delivery_type?: string;
  support_email?: string;
  support_phone?: string;
}

/**
 * Update product input
 */
export interface UpdateProductInput {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  status?: "active" | "inactive" | "draft";
  image_url?: string;
  slug?: string;
  delivery_type?: string;
  support_email?: string;
  support_phone?: string;
}

// ============================================
// API FUNCTIONS
// ============================================

const FUNCTION_NAME = "products-api";

/**
 * List products with pagination and filters
 */
async function list(
  params: ListParams = {}
): Promise<ApiResponse<PaginatedResponse<Product>>> {
  return api.call<PaginatedResponse<Product>>(FUNCTION_NAME, {
    action: "list",
    params,
  });
}

/**
 * Get a single product by ID
 */
async function get(productId: string): Promise<ApiResponse<Product>> {
  return api.call<Product>(FUNCTION_NAME, {
    action: "get",
    params: { productId },
  });
}

/**
 * Create a new product
 */
async function create(input: CreateProductInput): Promise<ApiResponse<MutationResponse>> {
  return api.call<MutationResponse>(FUNCTION_NAME, {
    action: "create",
    params: input,
  });
}

/**
 * Update an existing product
 */
async function update(input: UpdateProductInput): Promise<ApiResponse<MutationResponse>> {
  return api.call<MutationResponse>(FUNCTION_NAME, {
    action: "update",
    params: input,
  });
}

/**
 * Delete a product
 */
async function deleteProduct(productId: string): Promise<ApiResponse<MutationResponse>> {
  return api.call<MutationResponse>(FUNCTION_NAME, {
    action: "delete",
    params: { productId },
  });
}

/**
 * Get product settings
 */
async function getSettings(productId: string): Promise<ApiResponse<ProductSettings>> {
  return api.call<ProductSettings>(FUNCTION_NAME, {
    action: "get_settings",
    params: { productId },
  });
}

/**
 * Update product settings
 */
async function updateSettings(
  productId: string,
  settings: Partial<ProductSettings>
): Promise<ApiResponse<MutationResponse>> {
  return api.call<MutationResponse>(FUNCTION_NAME, {
    action: "update_settings",
    params: { productId, settings },
  });
}

// ============================================
// EXPORTED API OBJECT
// ============================================

export const productsApi = {
  list,
  get,
  create,
  update,
  delete: deleteProduct,
  getSettings,
  updateSettings,
} as const;
