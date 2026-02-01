/**
 * Shared utilities for admin-data tests
 * @module admin-data/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig } from "../../_shared/testing/mod.ts";

// ============================================
// CONFIGURATION (Centralized via getTestConfig)
// ============================================

const config = getTestConfig();

export const FUNCTION_NAME = "admin-data";
export const FUNCTION_URL = config.supabaseUrl
  ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
  : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

// ============================================
// ACTION CATEGORIES
// ============================================

export const SECURITY_ACTIONS = ["security-logs", "security-alerts", "security-blocked-ips", "security-stats"];
export const MEMBERS_AREA_ACTIONS = ["members-area-data", "members-area-modules", "members-area-settings", "members-area-modules-with-contents"];
export const USER_ACTIONS = ["users-with-metrics", "user-profile", "user-products", "user-gateway-status", "role-stats", "user-profile-name", "user-products-simple"];
export const PRODUCT_ACTIONS = ["check-unique-name", "admin-products", "admin-products-global", "product-offers", "order-bumps", "order-bump-detail", "gateway-connections", "check-unique-checkout-name", "product-detail-admin"];
export const ANALYTICS_ACTIONS = ["admin-analytics-financial", "admin-analytics-traffic", "admin-analytics-top-sellers"];
export const CONTENT_ACTIONS = ["content-editor-data", "content-drip-settings", "content-access-check", "vendor-integration", "marketplace-categories", "marketplace-stats"];

export const ALL_ACTIONS = [
  ...SECURITY_ACTIONS,
  ...MEMBERS_AREA_ACTIONS,
  ...USER_ACTIONS,
  "admin-orders",
  ...PRODUCT_ACTIONS,
  ...ANALYTICS_ACTIONS,
  ...CONTENT_ACTIONS,
];

// ============================================
// HANDLER NAMES
// ============================================

export const SECURITY_HANDLERS = ["getSecurityLogs", "getSecurityAlerts", "getSecurityBlockedIPs", "getSecurityStats"];
export const MEMBERS_AREA_HANDLERS = ["getMembersAreaData", "getMembersAreaModules", "getMembersAreaSettings", "getMembersAreaModulesWithContents"];
export const USER_HANDLERS = ["getUsersWithMetrics", "getUserProfile", "getUserProducts", "getUserGatewayStatus", "getRoleStats", "getUserProfileName", "getUserProductsSimple"];
export const ANALYTICS_HANDLERS = ["getAdminAnalyticsFinancial", "getAdminAnalyticsTraffic", "getAdminAnalyticsTopSellers"];
export const CONTENT_HANDLERS = ["getContentEditorData", "getContentDripSettings", "checkContentAccess", "getVendorIntegration", "getMarketplaceCategories", "getMarketplaceStats"];

// ============================================
// TYPES
// ============================================

export interface RequestBody {
  action: string;
  productId?: string;
  userId?: string;
  limit?: number;
  period?: string;
  orderBumpId?: string;
  affiliationProductId?: string;
  contentId?: string;
  buyerId?: string;
  purchaseDate?: string;
  filters?: Record<string, unknown>;
}

export interface ErrorResponse {
  error: string;
  code: string;
}

// ============================================
// HELPERS
// ============================================

export function getDefaultPeriod(body: RequestBody): string {
  return body.period ?? "all";
}

export function getDefaultLimit(body: RequestBody): number {
  return body.limit ?? 100;
}

export function isSecurityAction(action: string): boolean {
  return SECURITY_ACTIONS.includes(action);
}

export function isMembersAreaAction(action: string): boolean {
  return MEMBERS_AREA_ACTIONS.includes(action);
}

export function isAnalyticsAction(action: string): boolean {
  return ANALYTICS_ACTIONS.includes(action);
}
