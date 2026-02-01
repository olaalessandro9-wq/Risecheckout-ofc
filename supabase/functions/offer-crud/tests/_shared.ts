/**
 * Shared utilities for offer-crud tests
 * @module offer-crud/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig } from "../../_shared/testing/mod.ts";

// ============================================
// CONFIGURATION (Centralized via getTestConfig)
// ============================================

const config = getTestConfig();

export const FUNCTION_NAME = "offer-crud";
export const FUNCTION_URL = config.supabaseUrl
  ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
  : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

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
