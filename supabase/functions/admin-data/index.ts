/**
 * admin-data Edge Function
 * 
 * RISE Protocol V2 - Admin data access via Edge Function
 * 
 * Actions:
 * - security-logs: Get security audit logs (owner only)
 * - members-area-data: Get members area sections and settings
 * - members-area-modules: Get members area modules
 * 
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// ==========================================
// TYPES
// ==========================================

type Action = "security-logs" | "members-area-data" | "members-area-modules";

interface RequestBody {
  action: Action;
  productId?: string;
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

// ==========================================
// HANDLERS
// ==========================================

async function getSecurityLogs(
  supabase: SupabaseClient,
  producerId: string,
  limit: number,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Check if user is owner (has admin role)
  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (roleError || role?.role !== "owner") {
    console.warn(`[admin-data] User ${producerId} tried to access security logs without owner role`);
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("security_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin-data] Security logs error:", error);
    return errorResponse("Erro ao buscar logs", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ logs: data || [] }, corsHeaders);
}

async function getMembersAreaData(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Verify product ownership
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("user_id, members_area_settings")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  if (product.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  // Get sections
  const { data: sections, error: sectionsError } = await supabase
    .from("product_members_sections")
    .select("*")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (sectionsError) {
    console.error("[admin-data] Sections error:", sectionsError);
    return errorResponse("Erro ao buscar seções", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({
    sections: sections || [],
    settings: product.members_area_settings || {},
  }, corsHeaders);
}

async function getMembersAreaModules(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Verify product ownership
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  if (product.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("product_member_modules")
    .select("*")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    console.error("[admin-data] Modules error:", error);
    return errorResponse("Erro ao buscar módulos", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ modules: data || [] }, corsHeaders);
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

    const body = await req.json() as RequestBody;
    const { action, productId, limit = 100 } = body;

    console.log(`[admin-data] Action: ${action}, Producer: ${producer.id}`);

    switch (action) {
      case "security-logs":
        return getSecurityLogs(supabase, producer.id, limit, corsHeaders);

      case "members-area-data":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getMembersAreaData(supabase, productId, producer.id, corsHeaders);

      case "members-area-modules":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getMembersAreaModules(supabase, productId, producer.id, corsHeaders);

      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[admin-data] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
