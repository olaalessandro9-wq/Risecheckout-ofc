/**
 * get-affiliation-status - Edge Function para verificar status de afiliação
 * 
 * Verifica se o usuário logado já é afiliado de um produto e retorna o status.
 * Usa service_role para bypass de RLS (sistema usa autenticação customizada).
 * 
 * @version 2.0.0
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

// ============================================
// INTERFACES
// ============================================

interface RequestBody {
  product_id: string;
}

interface ProfileData {
  id: string;
  email: string;
}

interface SessionData {
  producer_id: string;
  expires_at: string;
  is_valid: boolean;
  profiles: ProfileData;
}

interface AffiliationData {
  id: string;
  status: "pending" | "active" | "rejected" | "blocked";
}

interface StatusResponse {
  isAffiliate: boolean;
  status?: "pending" | "active" | "rejected" | "blocked";
  affiliationId?: string;
  error?: string;
}

// ============================================
// HELPERS
// ============================================

function maskEmail(email: string): string {
  if (!email) return "***";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length > 2 ? local[0] + "***" + local[local.length - 1] : "***";
  return `${maskedLocal}@${domain}`;
}

// ============================================
// MAIN HANDLER
// ============================================

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
        JSON.stringify({ isAffiliate: false, error: "Token de sessão não fornecido" } as StatusResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body = await req.json() as RequestBody;
    const { product_id } = body;

    if (!product_id) {
      return new Response(
        JSON.stringify({ isAffiliate: false, error: "product_id é obrigatório" } as StatusResponse),
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
        JSON.stringify({ isAffiliate: false, error: "Sessão inválida" } as StatusResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typedSessionData = sessionData as unknown as SessionData;
    const userId = typedSessionData.producer_id;
    const userEmail = typedSessionData.profiles.email;

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
        JSON.stringify({ isAffiliate: false, error: "Erro ao verificar afiliação" } as StatusResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se não encontrou afiliação
    if (!affiliationData) {
      console.log(`📋 [get-affiliation-status] Nenhuma afiliação encontrada`);
      return new Response(
        JSON.stringify({ isAffiliate: false } as StatusResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typedAffiliation = affiliationData as AffiliationData;

    // Retornar status da afiliação
    const result: StatusResponse = {
      isAffiliate: typedAffiliation.status === "active",
      status: typedAffiliation.status,
      affiliationId: typedAffiliation.id,
    };

    console.log(`✅ [get-affiliation-status] Status: ${typedAffiliation.status}`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`🚨 [get-affiliation-status] Erro não tratado: ${errorMessage}`);
    return new Response(
      JSON.stringify({ isAffiliate: false, error: errorMessage } as StatusResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
