/**
 * manage-user-status - Edge function para ações de moderação
 * 
 * Ações disponíveis:
 * - updateStatus: Alterar status do usuário (active, suspended, banned)
 * - updateCustomFee: Definir taxa personalizada do checkout
 * - updateProductStatus: Alterar status do produto (active, blocked, deleted)
 * 
 * Apenas owners podem usar esta função
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Cliente com service role para operações administrativas
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Cliente com token do usuário para verificar permissões
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação não fornecido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("[manage-user-status] Erro de autenticação:", authError);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o usuário é owner
    const { data: callerRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || callerRole?.role !== "owner") {
      console.error("[manage-user-status] Acesso negado. Role:", callerRole?.role);
      
      // Logar tentativa de acesso não autorizado
      await supabaseAdmin.rpc("log_security_event", {
        p_user_id: user.id,
        p_action: "PERMISSION_DENIED",
        p_resource: "manage-user-status",
        p_success: false,
        p_metadata: { attempted_role: callerRole?.role },
      });

      return new Response(
        JSON.stringify({ error: "Apenas owners podem executar esta ação" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse do body
    const body = await req.json();
    const { action, userId, status, reason, feePercent, productId } = body;

    console.log(`[manage-user-status] Action: ${action} by owner ${user.id}`);

    // Ação: Atualizar status do usuário
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

      // Atualizar profile
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          status,
          status_reason: reason || null,
          status_changed_at: new Date().toISOString(),
          status_changed_by: user.id,
        })
        .eq("id", userId);

      if (updateError) {
        console.error("[manage-user-status] Erro ao atualizar status:", updateError);
        throw updateError;
      }

      // Logar ação
      await supabaseAdmin.rpc("log_security_event", {
        p_user_id: user.id,
        p_action: `USER_STATUS_CHANGED_TO_${status.toUpperCase()}`,
        p_resource: "profiles",
        p_resource_id: userId,
        p_success: true,
        p_metadata: { target_user_id: userId, new_status: status, reason },
      });

      console.log(`[manage-user-status] User ${userId} status updated to ${status}`);
      
      return new Response(
        JSON.stringify({ success: true, message: `Status atualizado para ${status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ação: Atualizar taxa personalizada
    if (action === "updateCustomFee") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // feePercent pode ser null para resetar
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
        console.error("[manage-user-status] Erro ao atualizar taxa:", updateError);
        throw updateError;
      }

      // Logar ação
      await supabaseAdmin.rpc("log_security_event", {
        p_user_id: user.id,
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

      console.log(`[manage-user-status] User ${userId} custom fee updated to ${feePercent}`);
      
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

    // Ação: Atualizar status do produto
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

      // Buscar informações do produto antes de atualizar
      const { data: productData } = await supabaseAdmin
        .from("products")
        .select("name, user_id, status")
        .eq("id", productId)
        .single();

      // Atualizar produto
      const { error: updateError } = await supabaseAdmin
        .from("products")
        .update({ status })
        .eq("id", productId);

      if (updateError) {
        console.error("[manage-user-status] Erro ao atualizar produto:", updateError);
        throw updateError;
      }

      // Logar ação
      await supabaseAdmin.rpc("log_security_event", {
        p_user_id: user.id,
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

      console.log(`[manage-user-status] Product ${productId} status updated to ${status}`);
      
      return new Response(
        JSON.stringify({ success: true, message: `Produto atualizado para ${status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação não reconhecida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[manage-user-status] Erro:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
