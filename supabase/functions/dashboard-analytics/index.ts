/**
 * Dashboard Analytics Edge Function
 * 
 * BFF (Backend-for-Frontend) que agrega todas as métricas do dashboard em uma única chamada.
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * 
 * Actions:
 * - "full": Retorna currentMetrics, previousMetrics, chartOrders, recentOrders
 * - "metrics": Retorna apenas métricas (fallback)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";
import { handleFullDashboard } from "./handlers/fullHandler.ts";
import type { DashboardRequest } from "./types.ts";

const log = createLogger("dashboard-analytics");

// ==========================================
// HELPERS
// ==========================================

function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(
  message: string, 
  corsHeaders: Record<string, string>, 
  status = 400
): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

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

    // Authenticate using producer_session_token
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    const vendorId = producer.id;
    log.debug(`Producer authenticated: ${vendorId}`);

    // Parse request body
    let body: Partial<DashboardRequest> = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is ok for legacy GET-style requests
    }

    const { action, startDate, endDate, timezone = "America/Sao_Paulo" } = body;

    // Handle "full" action - BFF pattern
    if (action === "full") {
      if (!startDate || !endDate) {
        return errorResponse(
          "startDate and endDate are required for action 'full'",
          corsHeaders,
          400
        );
      }

      log.info(`Action: full | Range: ${startDate} to ${endDate} | TZ: ${timezone}`);

      const data = await handleFullDashboard(
        supabase,
        vendorId,
        startDate,
        endDate,
        timezone
      );

      log.info(`Response: ${data.currentMetrics.paid_count} paid, ${data.currentMetrics.paid_revenue_cents} cents`);

      return jsonResponse({ success: true, data }, corsHeaders);
    }

    // Fallback: action not recognized
    return errorResponse(
      `Unknown action: ${action}. Supported actions: 'full'`,
      corsHeaders,
      400
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error("Error:", errorMessage);
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
});
