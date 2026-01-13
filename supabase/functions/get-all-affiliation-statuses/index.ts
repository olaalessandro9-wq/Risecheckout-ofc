/**
 * Edge Function: get-all-affiliation-statuses
 * 
 * Retorna status de afiliação de TODOS os produtos para o usuário logado.
 * Usado para pré-carregar cache no marketplace e evitar requests individuais.
 * 
 * @returns { statuses: { [product_id]: { status, affiliationId } } }
 * @version 2.0.0 - RISE Protocol V2 Compliance (Zero any)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// === INTERFACES (Zero any) ===

interface SessionRecord {
  producer_id: string;
  expires_at: string;
  is_valid: boolean;
}

interface AffiliationRecord {
  id: string;
  product_id: string;
  status: string;
}

interface AffiliationStatus {
  status: string;
  affiliationId: string;
}

interface StatusResponse {
  statuses: Record<string, AffiliationStatus>;
}

// === MAIN HANDLER ===

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente não configuradas");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validar sessão via header Authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Token de sessão não fornecido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sessionToken = authHeader.replace("Bearer ", "");

    // Buscar sessão válida
    const { data: sessionData, error: sessionError } = await supabase
      .from("producer_sessions")
      .select("producer_id, expires_at, is_valid")
      .eq("session_token", sessionToken)
      .eq("is_valid", true)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle() as { data: SessionRecord | null; error: Error | null };

    if (sessionError || !sessionData) {
      console.error("[get-all-affiliation-statuses] Sessão inválida:", sessionError);
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = sessionData.producer_id;

    console.log(`[get-all-affiliation-statuses] Buscando status para usuário: ${userId.substring(0, 8)}...`);

    // Buscar todas as afiliações do usuário em UMA única query
    const { data: affiliations, error: affiliationsError } = await supabase
      .from("affiliates")
      .select("id, product_id, status")
      .eq("user_id", userId) as { data: AffiliationRecord[] | null; error: Error | null };

    if (affiliationsError) {
      console.error("[get-all-affiliation-statuses] Erro ao buscar afiliações:", affiliationsError);
      throw affiliationsError;
    }

    // Transformar em Map { [product_id]: { status, affiliationId } }
    const statuses: Record<string, AffiliationStatus> = {};

    if (affiliations && affiliations.length > 0) {
      for (const aff of affiliations) {
        statuses[aff.product_id] = {
          status: aff.status,
          affiliationId: aff.id,
        };
      }
    }

    console.log(`[get-all-affiliation-statuses] Encontradas ${Object.keys(statuses).length} afiliações`);

    const response: StatusResponse = { statuses };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[get-all-affiliation-statuses] Erro:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
