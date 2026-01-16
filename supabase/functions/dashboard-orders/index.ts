/**
 * Dashboard Orders Edge Function
 * 
 * Retorna pedidos para o dashboard do vendor
 * 
 * Actions:
 * - recent: Pedidos recentes (para tabela)
 * - chart: Pedidos pagos (para gráfico)
 * 
 * @version 1.0.0 - RISE Protocol V2
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// ==========================================
// TYPES
// ==========================================

interface OrderRecord {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_document: string | null;
  amount_cents: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    user_id: string;
  } | null;
}

interface RequestBody {
  action: "recent" | "chart";
  vendorId: string;
  startDate: string;
  endDate: string;
  limit?: number;
}

// ==========================================
// HELPERS
// ==========================================

function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, code: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ error: message, code }, corsHeaders, status);
}

const ORDER_SELECT = `
  id,
  customer_name,
  customer_email,
  customer_phone,
  customer_document,
  amount_cents,
  status,
  payment_method,
  created_at,
  product:product_id (
    id,
    name,
    image_url,
    user_id
  )
`;

// ==========================================
// HANDLERS
// ==========================================

async function handleRecentOrders(
  supabase: SupabaseClient,
  producerId: string,
  startDate: string,
  endDate: string,
  limit: number,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("vendor_id", producerId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[dashboard-orders] Recent orders error:", error);
    return errorResponse("Erro ao buscar pedidos recentes", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ orders: orders || [] }, corsHeaders);
}

async function handleChartOrders(
  supabase: SupabaseClient,
  producerId: string,
  startDate: string,
  endDate: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("vendor_id", producerId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[dashboard-orders] Chart orders error:", error);
    return errorResponse("Erro ao buscar pedidos para gráfico", "DB_ERROR", corsHeaders, 500);
  }

  // Filter only paid orders (case-insensitive)
  const paidOrders = (orders || []).filter(
    (order: OrderRecord) => order.status?.toLowerCase() === "paid"
  );

  return jsonResponse({ orders: paidOrders }, corsHeaders);
}

// ==========================================
// MAIN HANDLER
// ==========================================

serve(async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate using producer_session_token
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // Validate that the vendorId matches the authenticated producer
    const body = await req.json() as RequestBody;
    const { action, vendorId, startDate, endDate, limit = 50 } = body;

    // Security check: Producer can only access their own data
    if (vendorId !== producer.id) {
      console.warn(`[dashboard-orders] Producer ${producer.id} tried to access vendor ${vendorId}`);
      return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
    }

    console.log(`[dashboard-orders] Action: ${action}, Producer: ${producer.id}`);

    switch (action) {
      case "recent":
        return handleRecentOrders(supabase, producer.id, startDate, endDate, limit, corsHeaders);
      
      case "chart":
        return handleChartOrders(supabase, producer.id, startDate, endDate, corsHeaders);
      
      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[dashboard-orders] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
