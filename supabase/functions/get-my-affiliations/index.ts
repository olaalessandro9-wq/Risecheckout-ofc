/**
 * get-my-affiliations - Edge Function para listar afiliações do usuário
 * 
 * Lista todas as afiliações do usuário logado.
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
      console.error("🚨 [get-my-affiliations] Token de sessão não fornecido");
      return new Response(
        JSON.stringify({ affiliations: [], error: "Token de sessão não fornecido" }),
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
      console.error(`🚨 [get-my-affiliations] Sessão inválida: ${sessionError?.message || 'No session data'}`);
      return new Response(
        JSON.stringify({ affiliations: [], error: "Sessão inválida" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = sessionData.producer_id;
    const userEmail = (sessionData.profiles as any).email;

    console.log(`🔍 [get-my-affiliations] Buscando afiliações para ${maskEmail(userEmail)}`);

    // Buscar todas as afiliações do usuário com detalhes do produto
    const { data: affiliationsData, error: affiliationsError } = await supabaseClient
      .from("affiliates")
      .select(`
        id,
        commission_rate,
        status,
        created_at,
        affiliate_code,
        products:product_id (
          id,
          name
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (affiliationsError) {
      console.error(`🚨 [get-my-affiliations] Erro ao buscar afiliações: ${affiliationsError.message}`);
      return new Response(
        JSON.stringify({ affiliations: [], error: "Erro ao buscar afiliações" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Formatar resposta para o frontend
    const affiliations = (affiliationsData || []).map((aff: any) => ({
      id: aff.id,
      commission_rate: aff.commission_rate,
      status: aff.status,
      created_at: aff.created_at,
      affiliate_code: aff.affiliate_code,
      product: aff.products ? {
        id: aff.products.id,
        name: aff.products.name,
      } : null,
    }));

    console.log(`✅ [get-my-affiliations] Encontradas ${affiliations.length} afiliações`);

    return new Response(
      JSON.stringify({ affiliations }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error(`🚨 [get-my-affiliations] Erro não tratado: ${error.message}`);
    return new Response(
      JSON.stringify({ affiliations: [], error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
