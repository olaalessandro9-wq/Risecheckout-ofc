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
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiter.ts";

// Ações permitidas para afiliados
type AllowedAction = "update_gateways" | "cancel_affiliation";

interface UpdateGatewaysPayload {
  action: "update_gateways";
  affiliate_id: string;
  pix_gateway?: string | null;
  credit_card_gateway?: string | null;
  gateway_credentials?: Record<string, string>;
}

interface CancelAffiliationPayload {
  action: "cancel_affiliation";
  affiliate_id: string;
}

type RequestPayload = UpdateGatewaysPayload | CancelAffiliationPayload;

// Gateways válidos
const VALID_PIX_GATEWAYS = ["asaas", "mercadopago", "pushinpay", null];
const VALID_CC_GATEWAYS = ["mercadopago", "stripe", "asaas", null];

serve(async (req) => {
  // CORS handling
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    // Rate limiting - criar cliente admin primeiro
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rateLimitResult = await rateLimitMiddleware(
      supabaseAdmin as any,
      req,
      RATE_LIMIT_CONFIGS.AFFILIATION_MANAGE
    );
    if (rateLimitResult) {
      console.warn(`[update-affiliate-settings] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    // 1. Autenticação obrigatória
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[update-affiliate-settings] Sem header de autorização");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Criar cliente Supabase com token do usuário
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 3. Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[update-affiliate-settings] Erro de autenticação:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`[update-affiliate-settings] Usuário: ${userId.substring(0, 8)}...`);

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
    const { data: affiliate, error: fetchError } = await supabase
      .from("affiliates")
      .select("id, user_id, product_id, status")
      .eq("id", affiliate_id)
      .single();

    if (fetchError || !affiliate) {
      console.error("[update-affiliate-settings] Afiliação não encontrada:", fetchError?.message);
      return new Response(
        JSON.stringify({ error: "Afiliação não encontrada" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (affiliate.user_id !== userId) {
      console.error(`[update-affiliate-settings] ACESSO NEGADO: User ${userId.substring(0, 8)} tentou acessar afiliação de ${affiliate.user_id.substring(0, 8)}`);
      return new Response(
        JSON.stringify({ error: "Você não tem permissão para modificar esta afiliação" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. supabaseAdmin já criado acima para rate limiting - reutilizar

    // 7. Processar ação
    switch (action) {
      case "update_gateways": {
        const { pix_gateway, credit_card_gateway, gateway_credentials } = payload as UpdateGatewaysPayload;

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
        const { data: product } = await supabase
          .from("products")
          .select("affiliate_gateway_settings")
          .eq("id", affiliate.product_id)
          .single();

        const settings = product?.affiliate_gateway_settings as {
          pix_allowed?: string[];
          credit_card_allowed?: string[];
        } | null;

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

        // Executar UPDATE seguro
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (pix_gateway !== undefined) updateData.pix_gateway = pix_gateway;
        if (credit_card_gateway !== undefined) updateData.credit_card_gateway = credit_card_gateway;
        if (gateway_credentials !== undefined) updateData.gateway_credentials = gateway_credentials;

        const { error: updateError } = await supabaseAdmin
          .from("affiliates")
          .update(updateData)
          .eq("id", affiliate_id);

        if (updateError) {
          console.error("[update-affiliate-settings] Erro no UPDATE:", updateError.message);
          return new Response(
            JSON.stringify({ error: "Erro ao atualizar gateways" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[update-affiliate-settings] Gateways atualizados para afiliação ${affiliate_id.substring(0, 8)}`);
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
          console.error("[update-affiliate-settings] Erro ao cancelar:", cancelError.message);
          return new Response(
            JSON.stringify({ error: "Erro ao cancelar afiliação" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log de auditoria
        await supabaseAdmin
          .from("affiliate_audit_log")
          .insert({
            affiliate_id,
            action: "SELF_CANCEL",
            previous_status: affiliate.status,
            new_status: "cancelled",
            performed_by: userId,
            metadata: { reason: "Cancelado pelo próprio afiliado" }
          });

        console.log(`[update-affiliate-settings] Afiliação ${affiliate_id.substring(0, 8)} cancelada pelo usuário`);
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

  } catch (error) {
    console.error("[update-affiliate-settings] Erro não tratado:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
