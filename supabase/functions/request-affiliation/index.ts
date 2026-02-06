/**
 * request-affiliation Edge Function
 * 
 * RISE Protocol V3 - 10.0/10 Compliant
 * Uses 'users' table as SSOT for profile/gateway queries
 * 
 * @version 5.0.0 - Migrated from profiles to users (SSOT)
 * - Uses Shared Kernel for crypto, PII masking, rate limiting
 * - Zero duplicate code
 * - Clean separation of concerns
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer, ProducerAuth } from "../_shared/unified-auth.ts";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";
import { generateSecureAffiliateCode } from "../_shared/kernel/security/crypto-utils.ts";
import { maskEmail } from "../_shared/kernel/security/pii-masking.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("request-affiliation");

// ============================================
// TYPES (Local to this slice)
// ============================================

interface Product {
  id: string;
  name: string;
  user_id: string;
  affiliate_settings: AffiliateSettings | null;
  affiliate_gateway_settings: GatewaySettings | null;
}

interface AffiliateSettings {
  enabled?: boolean;
  requireApproval?: boolean;
  defaultRate?: number;
}

interface GatewaySettings {
  pix_allowed?: string[];
  credit_card_allowed?: string[];
}

interface ExistingAffiliation {
  id: string;
  status: string;
}

interface UserData {
  asaas_wallet_id: string | null;
  mercadopago_collector_id: string | null;
  stripe_account_id: string | null;
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  // Handle CORS with centralized handler
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    // Setup Supabase Client
    const supabaseClient: SupabaseClient = getSupabaseClient('general');

    // Parse body
    const { product_id } = await req.json();

    if (!product_id) {
      throw new Error("product_id é obrigatório");
    }

    // ============================================
    // AUTHENTICATION
    // ============================================
    let producer: ProducerAuth;
    try {
      producer = await requireAuthenticatedProducer(supabaseClient, req);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log.info(`Solicitação de ${maskEmail(producer.email)} para produto ${product_id}`);

    // ============================================
    // RATE LIMITING (usando módulo consolidado)
    // ============================================
    const rateLimitResult = await checkRateLimit(
      supabaseClient,
      `producer:${producer.id}`,
      RATE_LIMIT_CONFIGS.AFFILIATION_MANAGE
    );
    
    if (!rateLimitResult.allowed) {
      log.warn(`Rate limit excedido para ${maskEmail(producer.email)}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: rateLimitResult.error || "Muitas solicitações. Tente novamente mais tarde.",
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    // ============================================
    // FETCH USER PROFILE FOR GATEWAY VALIDATION
    // RISE V3: Use 'users' table as SSOT
    // ============================================
    const { data: userData } = await supabaseClient
      .from("users")
      .select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
      .eq("id", producer.id)
      .maybeSingle();

    const user = userData as UserData | null;

    log.info(`Conexões do usuário: Asaas=${!!user?.asaas_wallet_id}, MP=${!!user?.mercadopago_collector_id}, Stripe=${!!user?.stripe_account_id}`);

    // ============================================
    // FETCH PRODUCT AND VALIDATE PROGRAM
    // ============================================
    const { data: product, error: productError } = await supabaseClient
      .from("products")
      .select("id, name, user_id, affiliate_settings, affiliate_gateway_settings")
      .eq("id", product_id)
      .maybeSingle();

    if (productError || !product) {
      throw new Error("Produto não encontrado");
    }

    const typedProduct = product as Product;

    // ============================================
    // SECURITY: BLOCK SELF-AFFILIATION
    // ============================================
    if (typedProduct.user_id === producer.id) {
      log.warn(`Tentativa de auto-afiliação bloqueada: ${maskEmail(producer.email)}`);
      throw new Error("Você não pode se afiliar ao seu próprio produto");
    }

    // Verify affiliate program is active
    const affiliateSettings: AffiliateSettings = typedProduct.affiliate_settings || {};
    const programEnabled = affiliateSettings.enabled || false;

    if (!programEnabled) {
      throw new Error("O programa de afiliados não está ativo para este produto");
    }

    // Log gateway status (informative, doesn't block)
    const gatewaySettings: GatewaySettings = typedProduct.affiliate_gateway_settings || {};
    const pixAllowed = gatewaySettings.pix_allowed || ["asaas"];
    const cardAllowed = gatewaySettings.credit_card_allowed || ["mercadopago", "stripe"];

    const hasAllowedPixGateway = (
      (pixAllowed.includes("asaas") && user?.asaas_wallet_id) ||
      (pixAllowed.includes("mercadopago") && user?.mercadopago_collector_id) ||
      (pixAllowed.includes("pushinpay"))
    );
    
    const hasAllowedCardGateway = (
      (cardAllowed.includes("mercadopago") && user?.mercadopago_collector_id) ||
      (cardAllowed.includes("stripe") && user?.stripe_account_id)
    );

    log.info(`Gateway status: PIX=${hasAllowedPixGateway}, Card=${hasAllowedCardGateway}`);
    log.info(`Programa ativo para produto: ${typedProduct.name}`);

    // ============================================
    // VALIDATE EXISTING AFFILIATION
    // ============================================
    const { data: existingAffiliation } = await supabaseClient
      .from("affiliates")
      .select("id, status")
      .eq("product_id", product_id)
      .eq("user_id", producer.id)
      .maybeSingle();

    const typedAffiliation = existingAffiliation as ExistingAffiliation | null;

    if (typedAffiliation) {
      if (typedAffiliation.status === "active") {
        throw new Error("Você já é um afiliado ativo deste produto");
      } else if (typedAffiliation.status === "pending") {
        throw new Error("Você já possui uma solicitação pendente para este produto");
      } else if (typedAffiliation.status === "blocked") {
        throw new Error("Você foi bloqueado e não pode se afiliar a este produto");
      }
      // status === "rejected" allows resubmission
      log.info("Reenviando solicitação previamente recusada");
    }

    // ============================================
    // CREATE OR UPDATE AFFILIATION
    // ============================================
    const requireApproval = affiliateSettings.requireApproval || false;
    const initialStatus = requireApproval ? "pending" : "active";
    const affiliateCode = generateSecureAffiliateCode();

    let affiliation;

    if (typedAffiliation && typedAffiliation.status === "rejected") {
      // Update existing record
      const { data, error } = await supabaseClient
        .from("affiliates")
        .update({
          status: initialStatus,
          affiliate_code: affiliateCode,
          commission_rate: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", typedAffiliation.id)
        .select()
        .single();

      if (error) throw error;
      affiliation = data;
    } else {
      // Create new record
      const { data, error } = await supabaseClient
        .from("affiliates")
        .insert({
          product_id,
          user_id: producer.id,
          status: initialStatus,
          affiliate_code: affiliateCode,
          commission_rate: null,
        })
        .select()
        .single();

      if (error) throw error;
      affiliation = data;
    }

    log.info(`Afiliação criada: ${affiliation.id} (status: ${initialStatus})`);

    // ============================================
    // RETURN RESPONSE
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        affiliation_id: affiliation.id,
        status: initialStatus,
        requires_approval: requireApproval,
        affiliate_code: affiliateCode,
        message: requireApproval 
          ? "Solicitação enviada! Aguarde a aprovação do produtor."
          : "Parabéns! Você já é um afiliado ativo. Seu link está disponível.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Erro:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage || "Erro ao processar solicitação",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
