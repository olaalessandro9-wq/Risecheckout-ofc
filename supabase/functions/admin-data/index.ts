/**
 * admin-data Edge Function
 * 
 * RISE Protocol V3 - Admin data access via Edge Function
 * REFACTORED: Modular handlers in separate files
 * 
 * @version 2.0.0
 * @see 300-line limit compliance
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { errorResponse, type RequestBody } from "./types.ts";

// Handler imports
import { getSecurityLogs, getSecurityAlerts, getSecurityBlockedIPs, getSecurityStats } from "./handlers/security.ts";
import { getMembersAreaData, getMembersAreaModules, getMembersAreaSettings, getMembersAreaModulesWithContents } from "./handlers/members-area.ts";
import { getUsersWithMetrics, getUserProfile, getUserProducts, getUserGatewayStatus, getRoleStats, getUserProfileName, getUserProductsSimple } from "./handlers/users.ts";
import { getAdminOrders } from "./handlers/orders.ts";
import { checkUniqueName, getAdminProducts, getAdminProductsGlobal, getProductOffers, getOrderBumps } from "./handlers/products.ts";
import { getOrderBumpDetail, getGatewayConnections, checkUniqueCheckoutName, getProductDetailAdmin } from "./handlers/products-detail.ts";
import { getAdminAnalyticsFinancial, getAdminAnalyticsTraffic, getAdminAnalyticsTopSellers } from "./handlers/analytics.ts";
import { getContentEditorData, getContentDripSettings, checkContentAccess, getVendorIntegration, getMarketplaceCategories, getMarketplaceStats } from "./handlers/content.ts";

// ==========================================
// MAIN HANDLER
// ==========================================

serve(async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    const body = await req.json() as RequestBody;
    const { action, productId, userId, limit = 100, productName, period = "all" } = body;

    console.log(`[admin-data] Action: ${action}, Producer: ${producer.id}`);

    switch (action) {
      // Security handlers
      case "security-logs":
        return getSecurityLogs(supabase, producer.id, limit, corsHeaders);
      case "security-alerts":
        return getSecurityAlerts(supabase, producer.id, body.filters, corsHeaders);
      case "security-blocked-ips":
        return getSecurityBlockedIPs(supabase, producer.id, corsHeaders);
      case "security-stats":
        return getSecurityStats(supabase, producer.id, corsHeaders);

      // Members area handlers
      case "members-area-data":
        if (!productId) return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getMembersAreaData(supabase, productId, producer.id, corsHeaders);
      case "members-area-modules":
        if (!productId) return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getMembersAreaModules(supabase, productId, producer.id, corsHeaders);
      case "members-area-settings":
        if (!productId) return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getMembersAreaSettings(supabase, productId, producer.id, corsHeaders);
      case "members-area-modules-with-contents":
        if (!productId) return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getMembersAreaModulesWithContents(supabase, productId, producer.id, corsHeaders);

      // User handlers
      case "users-with-metrics":
        return getUsersWithMetrics(supabase, producer.id, corsHeaders);
      case "user-profile":
        if (!userId) return errorResponse("userId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getUserProfile(supabase, userId, producer.id, corsHeaders);
      case "user-products":
        if (!userId) return errorResponse("userId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getUserProducts(supabase, userId, producer.id, corsHeaders);
      case "user-gateway-status":
        return getUserGatewayStatus(supabase, producer.id, corsHeaders);
      case "role-stats":
        return getRoleStats(supabase, producer.id, corsHeaders);
      case "user-profile-name":
        return getUserProfileName(supabase, producer.id, corsHeaders);
      case "user-products-simple":
        return getUserProductsSimple(supabase, producer.id, corsHeaders);

      // Order handlers
      case "admin-orders":
        return getAdminOrders(supabase, producer.id, period, corsHeaders);

      // Product handlers
      case "check-unique-name":
        if (!productName) return errorResponse("productName é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return checkUniqueName(supabase, productName, corsHeaders);
      case "admin-products":
        return getAdminProducts(supabase, producer.id, corsHeaders);
      case "admin-products-global":
        return getAdminProductsGlobal(supabase, producer.id, corsHeaders);
      case "product-offers":
        if (!productId) return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getProductOffers(supabase, productId, corsHeaders);
      case "order-bumps":
        if (!productId) return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getOrderBumps(supabase, productId, producer.id, corsHeaders);
      case "order-bump-detail":
        if (!body.orderBumpId) return errorResponse("orderBumpId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getOrderBumpDetail(supabase, body.orderBumpId, corsHeaders);
      case "gateway-connections":
        if (!body.affiliationProductId) return errorResponse("affiliationProductId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getGatewayConnections(supabase, producer.id, body.affiliationProductId, corsHeaders);
      case "check-unique-checkout-name":
        if (!productId || !body.checkoutName) return errorResponse("productId e checkoutName são obrigatórios", "VALIDATION_ERROR", corsHeaders, 400);
        return checkUniqueCheckoutName(supabase, productId, body.checkoutName, corsHeaders);
      case "product-detail-admin":
        if (!productId) return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getProductDetailAdmin(supabase, productId, producer.id, corsHeaders);

      // Analytics handlers
      case "admin-analytics-financial":
        return getAdminAnalyticsFinancial(supabase, producer.id, period, corsHeaders);
      case "admin-analytics-traffic":
        return getAdminAnalyticsTraffic(supabase, producer.id, period, corsHeaders);
      case "admin-analytics-top-sellers":
        return getAdminAnalyticsTopSellers(supabase, producer.id, period, corsHeaders);

      // Content handlers
      case "content-editor-data":
        return getContentEditorData(supabase, body.contentId, body.moduleId, body.isNew || false, producer.id, corsHeaders);
      case "content-drip-settings":
        if (!productId) return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getContentDripSettings(supabase, productId, corsHeaders);
      case "content-access-check":
        if (!body.contentId || !body.buyerId || !body.purchaseDate) return errorResponse("contentId, buyerId e purchaseDate são obrigatórios", "VALIDATION_ERROR", corsHeaders, 400);
        return checkContentAccess(supabase, body.contentId, body.buyerId, body.purchaseDate, corsHeaders);
      case "vendor-integration":
        if (!body.integrationType) return errorResponse("integrationType é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getVendorIntegration(supabase, producer.id, body.integrationType, corsHeaders);
      case "marketplace-categories":
        return getMarketplaceCategories(supabase, corsHeaders);
      case "marketplace-stats":
        if (!productId) return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        return getMarketplaceStats(supabase, productId, corsHeaders);

      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[admin-data] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
