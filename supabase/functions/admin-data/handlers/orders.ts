/**
 * Order Handlers for admin-data
 * 
 * Handles: admin-orders
 * 
 * @see RISE Protocol V3 - Limite 300 linhas por arquivo
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse, getDateRange } from "../types.ts";

// ==========================================
// ADMIN ORDERS
// ==========================================

export async function getAdminOrders(
  supabase: SupabaseClient,
  producerId: string,
  period: string,
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

  const { start, end } = getDateRange(period);

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      customer_name,
      customer_email,
      customer_phone,
      customer_document,
      amount_cents,
      status,
      payment_method,
      vendor_id,
      created_at,
      product:product_id (
        id,
        name,
        image_url,
        user_id
      )
    `)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[admin-data] Orders error:", error);
    return errorResponse("Erro ao buscar pedidos", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ orders: orders || [] }, corsHeaders);
}
