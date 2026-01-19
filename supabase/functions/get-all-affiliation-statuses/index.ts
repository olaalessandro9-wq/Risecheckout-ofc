/**
 * Edge Function: get-all-affiliation-statuses
 * 
 * Retorna status de afiliação de TODOS os produtos para o usuário logado.
 * Usado para pré-carregar cache no marketplace e evitar requests individuais.
 * 
 * @returns { statuses: { [product_id]: { status, affiliationId } } }
 * @version 3.0.0 - RISE Protocol V3 (unified-auth)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

// === INTERFACES (Zero any) ===

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

    // Auth via unified-auth
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    const userId = producer.id;
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
