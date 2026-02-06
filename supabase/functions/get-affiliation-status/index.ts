/**
 * get-affiliation-status - Edge Function para verificar status de afiliação
 * 
 * Verifica se o usuário logado já é afiliado de um produto e retorna o status.
 * Usa domain 'general' para bypass de RLS via factory centralizado.
 * 
 * @version 3.0.0 - RISE Protocol V3 (unified-auth)
 */

import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { getAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("get-affiliation-status");

// ============================================
// INTERFACES
// ============================================

interface RequestBody {
  product_id: string;
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
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  // Handle CORS with dynamic origin validation
  const corsResult = handleCorsV2(req);
  
  if (corsResult instanceof Response) {
    return corsResult; // Preflight or blocked origin
  }
  
  const corsHeaders = corsResult.headers;

  try {
    // Criar cliente Supabase via factory centralizado (domain: general)
    const supabaseClient = getSupabaseClient('general');

    // Auth via unified-auth (opcional - retorna null se não autenticado)
    const producer = await getAuthenticatedProducer(supabaseClient, req);

    if (!producer) {
      log.warn("Sessão inválida ou não fornecida");
      return new Response(
        JSON.stringify({ isAffiliate: false, error: "Sessão inválida" } as StatusResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = producer.id;

    // Parse body
    const body = await req.json() as RequestBody;
    const { product_id } = body;

    if (!product_id) {
      return new Response(
        JSON.stringify({ isAffiliate: false, error: "product_id é obrigatório" } as StatusResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log.info(`Verificando status para ${producer.email} no produto ${product_id}`);

    // Buscar afiliação do usuário para este produto
    const { data: affiliationData, error: affiliationError } = await supabaseClient
      .from("affiliates")
      .select("id, status")
      .eq("product_id", product_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (affiliationError) {
      log.error(`Erro ao buscar afiliação: ${affiliationError.message}`);
      return new Response(
        JSON.stringify({ isAffiliate: false, error: "Erro ao verificar afiliação" } as StatusResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se não encontrou afiliação
    if (!affiliationData) {
      log.info("Nenhuma afiliação encontrada");
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

    log.info(`Status: ${typedAffiliation.status}`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error(`Erro não tratado: ${errorMessage}`);
    return new Response(
      JSON.stringify({ isAffiliate: false, error: errorMessage } as StatusResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
