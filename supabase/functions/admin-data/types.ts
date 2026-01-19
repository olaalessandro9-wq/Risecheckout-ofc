/**
 * admin-data Edge Function - Types
 * 
 * @see RISE Protocol V3 - Limite 300 linhas por arquivo
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==========================================
// ACTION TYPES
// ==========================================

export type Action = 
  | "security-logs" 
  | "members-area-data" 
  | "members-area-modules"
  | "users-with-metrics"
  | "admin-orders"
  | "user-profile"
  | "user-products"
  | "check-unique-name"
  | "user-gateway-status"
  | "role-stats"
  | "security-alerts"
  | "security-blocked-ips"
  | "security-stats"
  | "gateway-connections"
  | "product-offers"
  | "order-bumps"
  | "content-editor-data"
  | "admin-products"
  | "admin-analytics-financial"
  | "admin-analytics-traffic"
  | "admin-analytics-top-sellers"
  | "vendor-integration"
  | "payment-link-info"
  | "content-drip-settings"
  | "content-access-check"
  | "order-bump-detail"
  | "product-detail-admin"
  | "admin-products-global"
  | "marketplace-categories"
  | "marketplace-stats"
  | "user-profile-name"
  | "check-unique-checkout-name"
  | "user-products-simple"
  | "members-area-settings"
  | "members-area-modules-with-contents";

// ==========================================
// REQUEST BODY
// ==========================================

export interface RequestBody {
  action: Action;
  productId?: string;
  userId?: string;
  limit?: number;
  productName?: string;
  checkoutName?: string;
  period?: string;
  affiliationProductId?: string;
  contentId?: string;
  moduleId?: string;
  isNew?: boolean;
  integrationType?: string;
  slug?: string;
  buyerId?: string;
  purchaseDate?: string;
  orderBumpId?: string;
  filters?: {
    type?: string;
    severity?: string;
    acknowledged?: boolean;
  };
}

// ==========================================
// HANDLER CONTEXT
// ==========================================

export interface HandlerContext {
  supabase: SupabaseClient;
  producerId: string;
  corsHeaders: Record<string, string>;
}

// ==========================================
// HELPERS
// ==========================================

export function jsonResponse(
  data: unknown, 
  corsHeaders: Record<string, string>, 
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(
  message: string, 
  code: string, 
  corsHeaders: Record<string, string>, 
  status = 400
): Response {
  return jsonResponse({ error: message, code }, corsHeaders, status);
}

export function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const subDays = (d: Date, days: number) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000);
  
  switch (period) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday":
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case "7days":
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    case "30days":
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    case "all":
    default:
      return { start: new Date("2020-01-01"), end: endOfDay(now) };
  }
}
