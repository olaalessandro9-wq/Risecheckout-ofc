/**
 * Shared utilities for product-crud tests
 * @module product-crud/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";

// ============================================
// CONFIGURATION
// ============================================

export const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
export const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
export const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/product-crud`;

// ============================================
// CONSTANTS
// ============================================

export const VALID_ACTIONS = ["list", "get", "create", "update", "delete"];
export const RATE_LIMITED_ACTIONS = ["create", "update"];
export const VALID_STATUSES = ["active", "inactive", "draft", "archived"];
export const DEFAULT_STATUS = "draft";
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

// ============================================
// TYPES
// ============================================

export interface ProductPayload {
  action?: string;
  productId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  product?: ProductData;
}

export interface ProductData {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  status?: string;
  user_id?: string;
}

// ============================================
// HELPERS
// ============================================

export function isValidAction(action: string): boolean {
  return VALID_ACTIONS.includes(action);
}

export function isRateLimited(action: string): boolean {
  return RATE_LIMITED_ACTIONS.includes(action);
}

export function getPage(body: ProductPayload): number {
  return typeof body.page === "number" ? body.page : DEFAULT_PAGE;
}

export function getPageSize(body: ProductPayload): number {
  return typeof body.pageSize === "number" ? body.pageSize : DEFAULT_PAGE_SIZE;
}

export function getSortOrder(value: string | undefined): "asc" | "desc" | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}

export function isValidPrice(price: number): boolean {
  return price >= 0;
}

export function convertReaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

export function sanitizeText(value: string | undefined): string {
  return value?.trim() ?? "";
}
