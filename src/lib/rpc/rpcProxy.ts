/**
 * RPC Proxy - Centralized RPC invocation via Edge Function
 * 
 * All RPC calls go through this utility.
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @see supabase/functions/rpc-proxy/index.ts
 */

import { api } from "@/lib/api";
import { createRpcError } from "./errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("RpcProxy");

interface RpcProxyResponse<T> {
  data?: T;
  error?: string;
}

export type RpcAuthLevel = "public" | "producer" | "admin";

export interface RpcResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Invokes an RPC via the rpc-proxy Edge Function
 * 
 * RISE V3: Autenticação via cookies httpOnly (credentials: include em api.call)
 * 
 * @param rpcName - Name of the RPC function to call
 * @param params - Parameters to pass to the RPC
 * @param authLevel - Authentication level required (public, producer, admin)
 * @returns Promise with data or error
 */
export async function invokeRpc<T>(
  rpcName: string,
  params: Record<string, unknown> = {},
  authLevel: RpcAuthLevel = "public"
): Promise<RpcResult<T>> {
  try {
    // RISE V3: api.call usa credentials: include, cookies são enviados automaticamente
    const isPublic = authLevel === "public";
    
    const { data, error } = isPublic 
      ? await api.publicCall<RpcProxyResponse<T>>("rpc-proxy", { rpc: rpcName, params })
      : await api.call<RpcProxyResponse<T>>("rpc-proxy", { rpc: rpcName, params });

    if (error) {
      log.error(`Error invoking ${rpcName}:`, error);
      // RISE V3: Preservar código de erro para tratamento adequado
      return { data: null, error: createRpcError(error.code, error.message) };
    }

    // The rpc-proxy returns { data: <result> } on success
    if (data?.error) {
      // RISE V3: Erros internos tratados como INTERNAL_ERROR
      return { data: null, error: createRpcError("INTERNAL_ERROR", data.error) };
    }

    return { data: data?.data as T, error: null };
  } catch (err) {
    log.error(`Exception invoking ${rpcName}:`, err);
    return { data: null, error: err as Error };
  }
}

// ============================================
// Typed RPC Helpers for common operations
// ============================================

/**
 * Validates a coupon code for a product
 */
export async function validateCouponRpc(code: string, productId: string) {
  return invokeRpc<{
    valid: boolean;
    error?: string;
    id?: string;
    code?: string;
    name?: string;
    discount_type?: string;
    discount_value?: number;
    apply_to_order_bumps?: boolean;
  }>("validate_coupon", { p_code: code, p_product_id: productId }, "public");
}

/**
 * Gets checkout info by payment slug
 */
export async function getCheckoutBySlugRpc(slug: string) {
  return invokeRpc<Array<{ checkout_id: string; product_id: string }>>(
    "get_checkout_by_payment_slug",
    { p_slug: slug },
    "public"
  );
}

/**
 * Gets affiliate checkout info
 */
export async function getAffiliateCheckoutInfoRpc(
  affiliateCode: string,
  productId: string
) {
  return invokeRpc<Array<{
    pix_gateway: string | null;
    credit_card_gateway: string | null;
    mercadopago_public_key: string | null;
    stripe_public_key: string | null;
  }>>(
    "get_affiliate_checkout_info",
    { p_affiliate_code: affiliateCode, p_product_id: productId },
    "public"
  );
}

/**
 * Gets order for payment with access token validation
 */
export async function getOrderForPaymentRpc(orderId: string, accessToken: string) {
  return invokeRpc<Record<string, unknown>>(
    "get_order_for_payment",
    { p_order_id: orderId, p_access_token: accessToken },
    "public"
  );
}

/**
 * Increments marketplace view count
 */
export async function incrementMarketplaceViewRpc(productId: string) {
  return invokeRpc<null>(
    "increment_marketplace_view",
    { p_product_id: productId },
    "public"
  );
}

/**
 * Increments marketplace click count
 */
export async function incrementMarketplaceClickRpc(productId: string) {
  return invokeRpc<null>(
    "increment_marketplace_click",
    { p_product_id: productId },
    "public"
  );
}

/**
 * Attaches offer to checkout smartly
 */
export async function attachOfferToCheckoutSmartRpc(
  checkoutId: string,
  offerId: string
) {
  return invokeRpc<{
    link_id: string;
    created: boolean;
    error_code?: string;
    error_message?: string;
  }>(
    "attach_offer_to_checkout_smart",
    { p_checkout_id: checkoutId, p_offer_id: offerId },
    "producer"
  );
}

/**
 * Clones checkout layout
 */
export async function cloneCheckoutLayoutRpc(
  sourceCheckoutId: string,
  targetCheckoutId: string
) {
  return invokeRpc<null>(
    "clone_checkout_layout",
    { p_source_checkout_id: sourceCheckoutId, p_target_checkout_id: targetCheckoutId },
    "producer"
  );
}

/**
 * Duplicates checkout (shallow)
 */
export async function duplicateCheckoutShallowRpc(sourceCheckoutId: string) {
  return invokeRpc<string>(
    "duplicate_checkout_shallow",
    { p_source_checkout_id: sourceCheckoutId },
    "producer"
  );
}

/**
 * Gets dashboard metrics
 */
export async function getDashboardMetricsRpc(
  vendorId: string,
  startDate: string,
  endDate: string
) {
  return invokeRpc<Record<string, unknown>>(
    "get_dashboard_metrics",
    { p_vendor_id: vendorId, p_start_date: startDate, p_end_date: endDate },
    "producer"
  );
}

/**
 * Gets producer affiliates
 */
export async function getProducerAffiliatesRpc(searchTerm: string) {
  return invokeRpc<Array<Record<string, unknown>>>(
    "get_producer_affiliates",
    { search_term: searchTerm },
    "producer"
  );
}

// RISE V3: Removido getUserEmailRpc - usava auth.users abandonada
// Emails agora vêm direto da tabela 'users' via getUsersWithMetrics

/**
 * Gets system health summary (admin only)
 */
export async function getSystemHealthSummaryRpc() {
  return invokeRpc<Array<Record<string, unknown>>>(
    "get_system_health_summary",
    {},
    "admin"
  );
}

/**
 * Gets unresolved errors (admin only)
 */
export async function getUnresolvedErrorsRpc() {
  return invokeRpc<Array<Record<string, unknown>>>(
    "get_unresolved_errors",
    {},
    "admin"
  );
}

/**
 * Gets webhook stats for last 24h (admin only)
 */
export async function getWebhookStats24hRpc() {
  return invokeRpc<{
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    avg_attempts: number;
  }>("get_webhook_stats_24h", {}, "admin");
}
