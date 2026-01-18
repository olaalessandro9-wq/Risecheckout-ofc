/**
 * request-affiliation Edge Function
 * 
 * @version 4.0.0 - RISE Protocol V3 Compliant (Vertical Slice Architecture)
 * - Uses Shared Kernel for crypto, PII masking, rate limiting
 * - Zero duplicate code
 * - Clean separation of concerns
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { requireAuthenticatedProducer, ProducerAuth } from "../_shared/unified-auth.ts";
import { checkProducerRateLimit, recordProducerAttempt } from "../_shared/producer-rate-limit.ts";
import { generateSecureAffiliateCode } from "../_shared/kernel/security/crypto-utils.ts";
import { maskEmail } from "../_shared/kernel/security/pii-masking.ts";

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

interface ProfileData {
  asaas_wallet_id: string | null;
  mercadopago_collector_id: string | null;
  stripe_account_id: string | null;
}

// ============================================
// CONSTANTS
// ============================================

const RATE_LIMIT_ACTION = "request-affiliation";
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MINUTES = 1;

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  // Handle CORS with centralized handler
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    // Setup Supabase Client
    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    console.log(`📝 [request-affiliation] Solicitação de ${maskEmail(producer.email)} para produto ${product_id}`);

    // ============================================
    // RATE LIMITING (usando Shared Kernel)
    // ============================================
    const rateLimitResult = await checkProducerRateLimit(
      supabaseClient,
      producer.id,
      RATE_LIMIT_ACTION,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MINUTES
    );
    
    if (!rateLimitResult.allowed) {
      console.warn(`🚫 [request-affiliation] Rate limit excedido para ${maskEmail(producer.email)}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Muitas solicitações. Tente novamente em ${rateLimitResult.retryAfter} segundos.`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    // Registrar tentativa
    await recordProducerAttempt(supabaseClient, producer.id, RATE_LIMIT_ACTION);

    // ============================================
    // FETCH USER PROFILE FOR GATEWAY VALIDATION
    // ============================================
    const { data: userProfile } = await supabaseClient
      .from("profiles")
      .select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
      .eq("id", producer.id)
      .maybeSingle();

    const profileData = userProfile as ProfileData | null;

    console.log(`✅ [request-affiliation] Conexões do usuário: Asaas=${!!profileData?.asaas_wallet_id}, MP=${!!profileData?.mercadopago_collector_id}, Stripe=${!!profileData?.stripe_account_id}`);

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
      console.warn(`🚫 [request-affiliation] Tentativa de auto-afiliação bloqueada: ${maskEmail(producer.email)}`);
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
      (pixAllowed.includes("asaas") && profileData?.asaas_wallet_id) ||
      (pixAllowed.includes("mercadopago") && profileData?.mercadopago_collector_id) ||
      (pixAllowed.includes("pushinpay"))
    );
    
    const hasAllowedCardGateway = (
      (cardAllowed.includes("mercadopago") && profileData?.mercadopago_collector_id) ||
      (cardAllowed.includes("stripe") && profileData?.stripe_account_id)
    );

    console.log(`ℹ️ [request-affiliation] Gateway status: PIX=${hasAllowedPixGateway}, Card=${hasAllowedCardGateway}`);
    console.log(`✅ [request-affiliation] Programa ativo para produto: ${typedProduct.name}`);

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
      console.log(`🔄 [request-affiliation] Reenviando solicitação previamente recusada`);
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

    console.log(`✅ [request-affiliation] Afiliação criada: ${affiliation.id} (status: ${initialStatus})`);

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
    console.error("🚨 [request-affiliation] Erro:", error);
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
