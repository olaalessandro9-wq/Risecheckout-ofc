/**
 * Product Detail Handlers for admin-data - Part 2
 * 
 * Handles: order-bump-detail, gateway-connections, check-unique-checkout-name,
 *          product-detail-admin
 * 
 * @see RISE Protocol V3 - Limite 300 linhas por arquivo
 * @see products.ts for main product handlers
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../types.ts";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("admin-data/products-detail");

// ==========================================
// ORDER BUMP DETAIL
// ==========================================

export async function getOrderBumpDetail(
  supabase: SupabaseClient,
  orderBumpId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("order_bumps")
    .select("*")
    .eq("id", orderBumpId)
    .single();

  if (error) throw error;

  return jsonResponse({ orderBump: data }, corsHeaders);
}

// ==========================================
// GATEWAY CONNECTIONS
// ==========================================

export async function getGatewayConnections(
  supabase: SupabaseClient,
  producerId: string,
  affiliationProductId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: productData } = await supabase
    .from("products")
    .select("affiliate_gateway_settings")
    .eq("id", affiliationProductId)
    .single();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
    .eq("id", producerId)
    .single();

  const { data: pushinpayData } = await supabase
    .from("payment_gateway_settings")
    .select("pushinpay_account_id, pushinpay_token")
    .eq("user_id", producerId)
    .single();

  const connections: Record<string, boolean> = {
    asaas: !!profileData?.asaas_wallet_id,
    mercadopago: !!profileData?.mercadopago_collector_id,
    stripe: !!profileData?.stripe_account_id,
    pushinpay: !!(pushinpayData?.pushinpay_token && pushinpayData?.pushinpay_account_id),
  };

  const credentials = {
    asaas_wallet_id: profileData?.asaas_wallet_id,
    mercadopago_collector_id: profileData?.mercadopago_collector_id,
    stripe_account_id: profileData?.stripe_account_id,
    pushinpay_account_id: pushinpayData?.pushinpay_account_id,
  };

  return jsonResponse({
    productSettings: productData?.affiliate_gateway_settings || {},
    connections,
    credentials,
  }, corsHeaders);
}

// ==========================================
// CHECK UNIQUE CHECKOUT NAME
// ==========================================

export async function checkUniqueCheckoutName(
  supabase: SupabaseClient,
  productId: string,
  baseName: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let candidate = baseName;
  let suffix = 2;
  
  while (true) {
    const { data, error } = await supabase
      .from("checkouts")
      .select("id")
      .eq("product_id", productId)
      .eq("name", candidate)
      .limit(1);
    
    if (error) {
      log.error("Check unique checkout name error", error);
      return errorResponse("Erro ao verificar nome", "DB_ERROR", corsHeaders, 500);
    }
    
    if (!data || data.length === 0) {
      return jsonResponse({ uniqueName: candidate }, corsHeaders);
    }
    
    candidate = baseName.includes('(Cópia)') 
      ? `${baseName.replace(/\s*\(Cópia.*?\)/, '')} (Cópia ${suffix})` 
      : `${baseName} (${suffix})`;
    suffix++;
  }
}

// ==========================================
// PRODUCT DETAIL ADMIN
// ==========================================

export async function getProductDetailAdmin(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (roleError || !role || (role.role !== "owner" && role.role !== "admin")) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, status, support_name, support_email, created_at, user_id")
    .eq("id", productId)
    .single();

  if (productError) {
    log.error("Product detail error", productError);
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  let vendorName = "Desconhecido";
  if (product.user_id) {
    const { data: vendor } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", product.user_id)
      .maybeSingle();
    vendorName = vendor?.name || "Desconhecido";
  }

  const { data: offers } = await supabase
    .from("offers")
    .select("id, name, price, status, is_default")
    .eq("product_id", productId)
    .eq("status", "active")
    .order("is_default", { ascending: false });

  return jsonResponse({
    product,
    vendorName,
    offers: offers || [],
  }, corsHeaders);
}
