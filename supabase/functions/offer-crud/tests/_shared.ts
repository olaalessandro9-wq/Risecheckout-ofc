/**
 * Shared utilities for offer-crud tests
 * @module offer-crud/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================
// CONFIGURATION (Hardcoded for unit tests - no dotenv dependency)
// ============================================

export const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdmJ0bXRncHN4dXBmand3b3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3Mjg2NzIsImV4cCI6MjA4MTA4ODY3Mn0.h8HDRdHaVTZpZLqBxj7bODaUPCox2h6HF_3U1xfbSXY";
export const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/offer-crud`;

// ============================================
// CONSTANTS
// ============================================

export const VALID_ACTIONS = ["list", "get", "create", "update", "delete"];
export const VALID_STATUSES = ["active", "inactive", "archived"];
export const DEFAULT_STATUS = "active";
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

// ============================================
// TYPES
// ============================================

export interface OfferPayload {
  action?: string;
  offer_id?: string;
  offerId?: string;
  productId?: string;
  page?: number;
  pageSize?: number;
  status?: string;
  offer?: OfferData;
}

export interface OfferData {
  id?: string;
  product_id?: string;
  name?: string;
  price?: number;
  is_default?: boolean;
  status?: string;
  description?: string;
}

// ============================================
// HELPERS
// ============================================

export function isValidAction(action: string): boolean {
  return VALID_ACTIONS.includes(action);
}

export function getActionFromBody(body: OfferPayload, urlAction: string): string {
  const bodyAction = typeof body.action === "string" ? body.action : null;
  return bodyAction ?? urlAction;
}

export function getOfferId(body: OfferPayload): string | undefined {
  return body.offer_id ?? body.offerId;
}

export function getPage(body: OfferPayload): number {
  return typeof body.page === "number" ? body.page : DEFAULT_PAGE;
}

export function getPageSize(body: OfferPayload): number {
  return typeof body.pageSize === "number" ? body.pageSize : DEFAULT_PAGE_SIZE;
}

export function isValidPrice(price: number): boolean {
  return price >= 0;
}

export function convertReaisToCents(reais: number): number {
  return Math.round(reais * 100);
}
