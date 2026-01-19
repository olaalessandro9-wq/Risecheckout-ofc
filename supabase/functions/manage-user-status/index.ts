/**
 * manage-user-status - Edge function para ações de moderação
 * 
 * Ações disponíveis:
 * - updateStatus: Alterar status do usuário (active, suspended, banned)
 * - updateCustomFee: Definir taxa personalizada do checkout
 * - updateProductStatus: Alterar status do produto (active, blocked, deleted)
 * 
 * Apenas owners podem usar esta função
 * CORS restrito a domínios permitidos
 * 
 * @version 1.1.0
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("manage-user-status");

Deno.serve(async (req) => {
  // SECURITY: CORS V2 com separação de ambiente (prod/dev)
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult; // Retorna 403 ou preflight response
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Rate limiting para ações admin
    const rateLimitResult = await rateLimitMiddleware(
      supabaseAdmin,
      req,
      RATE_LIMIT_CONFIGS.ADMIN_ACTION,
      corsHeaders
    );
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }
    
    // SECURITY: Autenticação via unified-auth
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabaseAdmin, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // Verificar se é owner
    if (producer.role !== "owner") {
      log.error("Acesso negado. Role:", producer.role);
      
      await supabaseAdmin.rpc("log_security_event", {
        p_user_id: producer.id,
        p_action: "PERMISSION_DENIED",
        p_resource: "manage-user-status",
        p_success: false,
        p_metadata: { attempted_role: producer.role },
      });

      return new Response(
        JSON.stringify({ error: "Apenas owners podem executar esta ação" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, userId, status, reason, feePercent, productId } = body;

    log.info(`Action: ${action} by owner ${producer.id}`);

    if (action === "updateStatus") {
      if (!userId || !status) {
        return new Response(
          JSON.stringify({ error: "userId e status são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const validStatuses = ["active", "suspended", "banned"];
      if (!validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ error: "Status inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          status,
          status_reason: reason || null,
          status_changed_at: new Date().toISOString(),
          status_changed_by: producer.id,
        })
        .eq("id", userId);

      if (updateError) {
        log.error("Erro ao atualizar status:", updateError);
        throw updateError;
      }

      await supabaseAdmin.rpc("log_security_event", {
        p_user_id: producer.id,
        p_action: `USER_STATUS_CHANGED_TO_${status.toUpperCase()}`,
        p_resource: "profiles",
        p_resource_id: userId,
        p_success: true,
        p_metadata: { target_user_id: userId, new_status: status, reason },
      });

      log.info(`User ${userId} status updated to ${status}`);
      
      return new Response(
        JSON.stringify({ success: true, message: `Status atualizado para ${status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "updateCustomFee") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (feePercent !== null && (typeof feePercent !== "number" || feePercent < 0 || feePercent > 1)) {
        return new Response(
          JSON.stringify({ error: "feePercent deve ser um número entre 0 e 1 (ex: 0.04 = 4%)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          custom_fee_percent: feePercent,
        })
        .eq("id", userId);

      if (updateError) {
        log.error("Erro ao atualizar taxa:", updateError);
        throw updateError;
      }

      await supabaseAdmin.rpc("log_security_event", {
        p_user_id: producer.id,
        p_action: feePercent === null ? "CUSTOM_FEE_RESET" : "CUSTOM_FEE_SET",
        p_resource: "profiles",
        p_resource_id: userId,
        p_success: true,
        p_metadata: { 
          target_user_id: userId, 
          fee_percent: feePercent,
          fee_display: feePercent !== null ? `${(feePercent * 100).toFixed(2)}%` : "default (4%)",
        },
      });

      log.info(`User ${userId} custom fee updated to ${feePercent}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: feePercent === null 
            ? "Taxa resetada para padrão (4%)" 
            : `Taxa atualizada para ${(feePercent * 100).toFixed(2)}%` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "updateProductStatus") {
      if (!productId || !status) {
        return new Response(
          JSON.stringify({ error: "productId e status são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const validStatuses = ["active", "blocked", "deleted"];
      if (!validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ error: "Status inválido para produto" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: productData } = await supabaseAdmin
        .from("products")
        .select("name, user_id, status")
        .eq("id", productId)
        .single();

      const { error: updateError } = await supabaseAdmin
        .from("products")
        .update({ status })
        .eq("id", productId);

      if (updateError) {
        log.error("Erro ao atualizar produto:", updateError);
        throw updateError;
      }

      await supabaseAdmin.rpc("log_security_event", {
        p_user_id: producer.id,
        p_action: `PRODUCT_STATUS_CHANGED_TO_${status.toUpperCase()}`,
        p_resource: "products",
        p_resource_id: productId,
        p_success: true,
        p_metadata: { 
          product_name: productData?.name,
          product_owner: productData?.user_id,
          previous_status: productData?.status,
          new_status: status,
        },
      });

      log.info(`Product ${productId} status updated to ${status}`);
      
      return new Response(
        JSON.stringify({ success: true, message: `Produto atualizado para ${status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação não reconhecida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    log.error("Erro:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
