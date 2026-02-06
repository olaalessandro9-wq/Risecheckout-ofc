/**
 * update-affiliate-settings - Edge Function segura para updates de afiliado
 * 
 * SEGURANÇA: Esta função substitui o UPDATE direto via RLS para afiliados.
 * Apenas permite operações específicas e validadas:
 * 
 * 1. Atualizar gateways (pix_gateway, credit_card_gateway)
 * 2. Atualizar credenciais de gateway (gateway_credentials)
 * 3. Cancelar própria afiliação (status: "cancelled")
 * 
 * BLOQUEADO: Alteração de commission_rate, status (exceto cancelled), 
 *            total_sales_count, total_sales_amount, affiliate_code
 * 
 * @version 2.0.0 - RISE ARCHITECT PROTOCOL V3 - 10.0/10 (Zero any)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiting/index.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("update-affiliate-settings");

// === INTERFACES (Zero any) ===

// Ações permitidas para afiliados
type AllowedAction = "update_gateways" | "cancel_affiliation";

/**
 * UpdateGatewaysPayload
 * 
 * RISE V3 Solution D: gateway_credentials REMOVED
 * Affiliates now inherit credentials from their own profile.
 * To update credentials, affiliate uses Settings > Integrações (profile).
 */
interface UpdateGatewaysPayload {
  action: "update_gateways";
  affiliate_id: string;
  pix_gateway?: string | null;
  credit_card_gateway?: string | null;
}

interface CancelAffiliationPayload {
  action: "cancel_affiliation";
  affiliate_id: string;
}

type RequestPayload = UpdateGatewaysPayload | CancelAffiliationPayload;

interface AffiliateRecord {
  id: string;
  user_id: string;
  product_id: string;
  status: string;
}

interface ProductRecord {
  affiliate_gateway_settings: {
    pix_allowed?: string[];
    credit_card_allowed?: string[];
  } | null;
}

interface AuditLogEntry {
  affiliate_id: string;
  action: string;
  previous_status: string;
  new_status: string;
  performed_by: string;
  metadata: Record<string, unknown>;
}

// Gateways válidos
const VALID_PIX_GATEWAYS = ["asaas", "mercadopago", "pushinpay", null];
const VALID_CC_GATEWAYS = ["mercadopago", "stripe", "asaas", null];

// === MAIN HANDLER ===

serve(async (req) => {
  // CORS handling
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    // Rate limiting - criar cliente admin primeiro
    const supabaseAdmin: SupabaseClient = getSupabaseClient('general');

    const rateLimitResult = await rateLimitMiddleware(
      supabaseAdmin,
      req,
      RATE_LIMIT_CONFIGS.AFFILIATION_MANAGE,
      corsHeaders
    );
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    // 1. Autenticação via unified-auth (Cookie: __Secure-rise_access)
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabaseAdmin, req);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error("Erro de autenticação:", errorMessage);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = producer.id;
    log.info(`Usuário: ${userId.substring(0, 8)}...`);

    // 2. Reutilizar supabaseAdmin para queries (RISE V3: domain 'general')
    // Ownership validation is done explicitly via user_id check below

    // 4. Parse do payload
    const payload: RequestPayload = await req.json();
    const { action, affiliate_id } = payload;

    if (!affiliate_id || !action) {
      return new Response(
        JSON.stringify({ error: "affiliate_id e action são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Verificar se o usuário é DONO desta afiliação
    const { data: affiliate, error: fetchError } = await supabaseAdmin
      .from("affiliates")
      .select("id, user_id, product_id, status")
      .eq("id", affiliate_id)
      .single() as { data: AffiliateRecord | null; error: Error | null };

    if (fetchError || !affiliate) {
      log.error("Afiliação não encontrada:", fetchError?.message);
      return new Response(
        JSON.stringify({ error: "Afiliação não encontrada" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (affiliate.user_id !== userId) {
      log.error(`ACESSO NEGADO: User ${userId.substring(0, 8)} tentou acessar afiliação de ${affiliate.user_id.substring(0, 8)}`);
      return new Response(
        JSON.stringify({ error: "Você não tem permissão para modificar esta afiliação" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. supabaseAdmin já criado acima para rate limiting - reutilizar

    // 7. Processar ação
    switch (action) {
      case "update_gateways": {
        const { pix_gateway, credit_card_gateway } = payload as UpdateGatewaysPayload;

        // Validar gateways
        if (pix_gateway !== undefined && !VALID_PIX_GATEWAYS.includes(pix_gateway)) {
          return new Response(
            JSON.stringify({ error: `Gateway PIX inválido: ${pix_gateway}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (credit_card_gateway !== undefined && !VALID_CC_GATEWAYS.includes(credit_card_gateway)) {
          return new Response(
            JSON.stringify({ error: `Gateway Cartão inválido: ${credit_card_gateway}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Buscar configurações permitidas do produto
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("affiliate_gateway_settings")
          .eq("id", affiliate.product_id)
          .single() as { data: ProductRecord | null };

        const settings = product?.affiliate_gateway_settings;

        const pixAllowed = settings?.pix_allowed || ["asaas"];
        const ccAllowed = settings?.credit_card_allowed || ["mercadopago", "stripe"];

        // Verificar se gateway escolhido está na lista permitida
        if (pix_gateway && !pixAllowed.includes(pix_gateway)) {
          return new Response(
            JSON.stringify({ error: `Gateway PIX '${pix_gateway}' não permitido para este produto` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (credit_card_gateway && !ccAllowed.includes(credit_card_gateway)) {
          return new Response(
            JSON.stringify({ error: `Gateway Cartão '${credit_card_gateway}' não permitido para este produto` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Executar UPDATE seguro (gateway_credentials REMOVED - RISE V3 Solution D)
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (pix_gateway !== undefined) updateData.pix_gateway = pix_gateway;
        if (credit_card_gateway !== undefined) updateData.credit_card_gateway = credit_card_gateway;

        const { error: updateError } = await supabaseAdmin
          .from("affiliates")
          .update(updateData)
          .eq("id", affiliate_id);

        if (updateError) {
          log.error("Erro no UPDATE:", updateError.message);
          return new Response(
            JSON.stringify({ error: "Erro ao atualizar gateways" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        log.info(`Gateways atualizados para afiliação ${affiliate_id.substring(0, 8)}`);
        return new Response(
          JSON.stringify({ success: true, message: "Gateways atualizados" }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case "cancel_affiliation": {
        // Verificar se já está cancelada
        if (affiliate.status === "cancelled") {
          return new Response(
            JSON.stringify({ error: "Afiliação já está cancelada" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Executar cancelamento
        const { error: cancelError } = await supabaseAdmin
          .from("affiliates")
          .update({ 
            status: "cancelled",
            updated_at: new Date().toISOString()
          })
          .eq("id", affiliate_id);

        if (cancelError) {
          log.error("Erro ao cancelar:", cancelError.message);
          return new Response(
            JSON.stringify({ error: "Erro ao cancelar afiliação" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log de auditoria
        const auditEntry: AuditLogEntry = {
          affiliate_id,
          action: "SELF_CANCEL",
          previous_status: affiliate.status,
          new_status: "cancelled",
          performed_by: userId,
          metadata: { reason: "Cancelado pelo próprio afiliado" }
        };
        await supabaseAdmin.from("affiliate_audit_log").insert(auditEntry);

        log.info(`Afiliação ${affiliate_id.substring(0, 8)} cancelada pelo usuário`);
        return new Response(
          JSON.stringify({ success: true, message: "Afiliação cancelada" }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Ação inválida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Erro não tratado:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
