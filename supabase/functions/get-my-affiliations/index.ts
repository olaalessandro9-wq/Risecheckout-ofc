/**
 * get-my-affiliations - Edge Function para listar afiliações do usuário
 * 
 * @version 3.0.0 - RISE Protocol V3 (unified-auth)
 * 
 * Lista todas as afiliações do usuário logado.
 * Usa service_role para bypass de RLS (sistema usa autenticação customizada).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { getAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("get-my-affiliations");

interface ProductData {
  id: string;
  name: string;
}

interface AffiliationRecord {
  id: string;
  commission_rate: number | null;
  status: string;
  created_at: string;
  affiliate_code: string;
  products: ProductData | ProductData[] | null;
}

interface FormattedAffiliation {
  id: string;
  commission_rate: number | null;
  status: string;
  created_at: string;
  affiliate_code: string;
  product: { id: string; name: string } | null;
}

Deno.serve(async (req) => {
  // Handle CORS with dynamic origin validation
  const corsResult = handleCorsV2(req);
  
  if (corsResult instanceof Response) {
    return corsResult; // Preflight or blocked origin
  }
  
  const corsHeaders = corsResult.headers;

  try {
    // Criar cliente Supabase com service_role para bypass de RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Auth via unified-auth
    const producer = await getAuthenticatedProducer(supabaseClient, req);

    if (!producer) {
      log.warn("Sessão inválida ou não fornecida");
      return new Response(
        JSON.stringify({ affiliations: [], error: "Sessão inválida" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = producer.id;
    log.info(`Buscando afiliações para ${producer.email}`);

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
      log.error(`Erro ao buscar afiliações: ${affiliationsError.message}`);
      return new Response(
        JSON.stringify({ affiliations: [], error: "Erro ao buscar afiliações" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Formatar resposta para o frontend
    const affiliations: FormattedAffiliation[] = ((affiliationsData || []) as AffiliationRecord[]).map((aff) => {
      const product = Array.isArray(aff.products) ? aff.products[0] : aff.products;
      return {
        id: aff.id,
        commission_rate: aff.commission_rate,
        status: aff.status,
        created_at: aff.created_at,
        affiliate_code: aff.affiliate_code,
        product: product ? {
          id: product.id,
          name: product.name,
        } : null,
      };
    });

    log.info(`Encontradas ${affiliations.length} afiliações`);

    return new Response(
      JSON.stringify({ affiliations }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    log.error(`Erro não tratado: ${message}`);
    return new Response(
      JSON.stringify({ affiliations: [], error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
