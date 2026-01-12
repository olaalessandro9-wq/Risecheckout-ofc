/**
 * get-affiliation-status - Edge Function para verificar status de afiliação
 * 
 * Verifica se o usuário logado já é afiliado de um produto e retorna o status.
 * Usa service_role para bypass de RLS (sistema usa autenticação customizada).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-producer-session-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Mascarar email para logs
function maskEmail(email: string): string {
  if (!email) return "***";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length > 2 ? local[0] + "***" + local[local.length - 1] : "***";
  return `${maskedLocal}@${domain}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obter token de sessão do header
    const sessionToken =
      req.headers.get("x-producer-session-token") ||
      req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!sessionToken) {
      console.error("🚨 [get-affiliation-status] Token de sessão não fornecido");
      return new Response(
        JSON.stringify({ isAffiliate: false, error: "Token de sessão não fornecido" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body = await req.json();
    const { product_id } = body;

    if (!product_id) {
      return new Response(
        JSON.stringify({ isAffiliate: false, error: "product_id é obrigatório" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase com service_role para bypass de RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validar sessão e obter usuário
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from("producer_sessions")
      .select(`
        producer_id,
        expires_at,
        is_valid,
        profiles:producer_id (
          id,
          email
        )
      `)
      .eq("session_token", sessionToken)
      .eq("is_valid", true)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !sessionData || !sessionData.profiles) {
      console.error(`🚨 [get-affiliation-status] Sessão inválida: ${sessionError?.message || 'No session data'}`);
      return new Response(
        JSON.stringify({ isAffiliate: false, error: "Sessão inválida" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = sessionData.producer_id;
    const userEmail = (sessionData.profiles as any).email;

    console.log(`🔍 [get-affiliation-status] Verificando status para ${maskEmail(userEmail)} no produto ${product_id}`);

    // Buscar afiliação do usuário para este produto
    const { data: affiliationData, error: affiliationError } = await supabaseClient
      .from("affiliates")
      .select("id, status")
      .eq("product_id", product_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (affiliationError) {
      console.error(`🚨 [get-affiliation-status] Erro ao buscar afiliação: ${affiliationError.message}`);
      return new Response(
        JSON.stringify({ isAffiliate: false, error: "Erro ao verificar afiliação" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se não encontrou afiliação
    if (!affiliationData) {
      console.log(`📋 [get-affiliation-status] Nenhuma afiliação encontrada`);
      return new Response(
        JSON.stringify({ isAffiliate: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Retornar status da afiliação
    const result = {
      isAffiliate: affiliationData.status === "active",
      status: affiliationData.status as "pending" | "active" | "rejected" | "blocked",
      affiliationId: affiliationData.id,
    };

    console.log(`✅ [get-affiliation-status] Status: ${affiliationData.status}`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error(`🚨 [get-affiliation-status] Erro não tratado: ${error.message}`);
    return new Response(
      JSON.stringify({ isAffiliate: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
