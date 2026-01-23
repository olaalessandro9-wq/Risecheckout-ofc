/**
 * Security Management Edge Function
 * 
 * Gerencia operações de segurança do painel administrativo:
 * - acknowledge-alert: Reconhece um alerta de segurança
 * - block-ip: Bloqueia um IP manualmente
 * - unblock-ip: Desbloqueia um IP
 * 
 * SECURITY:
 * - Autenticação via sessions (unified-auth, cookies)
 * - Apenas roles admin/owner podem executar
 * - Audit logging via log_security_event RPC
 * 
 * @version 2.0.0 - RISE V3 Compliance
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("security-management");

// ============================================
// TYPES
// ============================================

interface SecurityRequest {
  action: "acknowledge-alert" | "block-ip" | "unblock-ip";
  alertId?: string;
  ipAddress?: string;
  reason?: string;
  expiresInDays?: number;
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  // CORS handling
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate producer via unified-auth
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // Validate admin/owner role - busca de user_roles (não profiles)
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", producer.id)
      .single();

    if (roleError || !userRole) {
      log.error("Role not found:", roleError);
      return new Response(
        JSON.stringify({ success: false, error: "Permissão não encontrada" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const role = userRole.role as string;
    if (role !== "admin" && role !== "owner") {
      log.warn(`Access denied for role: ${role}`);
      return new Response(
        JSON.stringify({ success: false, error: "Acesso negado. Requer role admin ou owner." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const body: SecurityRequest = await req.json();
    const { action, alertId, ipAddress, reason, expiresInDays } = body;

    log.info(`Action: ${action} by ${producer.id}`);

    // Route to handler
    switch (action) {
      case "acknowledge-alert": {
        if (!alertId) {
          return new Response(
            JSON.stringify({ success: false, error: "alertId é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("security_alerts")
          .update({
            acknowledged: true,
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: producer.id,
          })
          .eq("id", alertId);

        if (error) {
          log.error("Error acknowledging alert:", error);
          return new Response(
            JSON.stringify({ success: false, error: "Erro ao reconhecer alerta" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Audit log
        await supabase.rpc("log_security_event", {
          p_user_id: producer.id,
          p_action: "ACKNOWLEDGE_ALERT",
          p_resource: "security_alerts",
          p_resource_id: alertId,
          p_success: true,
          p_ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
          p_user_agent: req.headers.get("user-agent") || null,
          p_metadata: { alertId },
        });

        log.info(`Alert ${alertId} acknowledged by ${producer.id}`);
        return new Response(
          JSON.stringify({ success: true, alertId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "block-ip": {
        if (!ipAddress || !reason) {
          return new Response(
            JSON.stringify({ success: false, error: "ipAddress e reason são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const expiresAt = expiresInDays
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
          : null;

        const { error } = await supabase
          .from("ip_blocklist")
          .upsert(
            {
              ip_address: ipAddress,
              reason,
              expires_at: expiresAt,
              is_active: true,
              created_by: producer.id,
              metadata: { manual_block: true, blocked_by: producer.id },
            },
            { onConflict: "ip_address" }
          );

        if (error) {
          log.error("Error blocking IP:", error);
          return new Response(
            JSON.stringify({ success: false, error: "Erro ao bloquear IP" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Audit log
        await supabase.rpc("log_security_event", {
          p_user_id: producer.id,
          p_action: "BLOCK_IP",
          p_resource: "ip_blocklist",
          p_resource_id: ipAddress,
          p_success: true,
          p_ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
          p_user_agent: req.headers.get("user-agent") || null,
          p_metadata: { ipAddress, reason, expiresInDays },
        });

        log.info(`IP ${ipAddress} blocked by ${producer.id}`);
        return new Response(
          JSON.stringify({ success: true, ipAddress, expiresAt }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "unblock-ip": {
        if (!ipAddress) {
          return new Response(
            JSON.stringify({ success: false, error: "ipAddress é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("ip_blocklist")
          .update({ 
            is_active: false, 
            updated_at: new Date().toISOString(),
          })
          .eq("ip_address", ipAddress);

        if (error) {
          log.error("Error unblocking IP:", error);
          return new Response(
            JSON.stringify({ success: false, error: "Erro ao desbloquear IP" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Audit log
        await supabase.rpc("log_security_event", {
          p_user_id: producer.id,
          p_action: "UNBLOCK_IP",
          p_resource: "ip_blocklist",
          p_resource_id: ipAddress,
          p_success: true,
          p_ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
          p_user_agent: req.headers.get("user-agent") || null,
          p_metadata: { ipAddress },
        });

        log.info(`IP ${ipAddress} unblocked by ${producer.id}`);
        return new Response(
          JSON.stringify({ success: true, ipAddress }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    log.error("Error:", errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
