/**
 * request-affiliation Edge Function
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * - Uses handleCors from _shared/cors.ts
 * - Uses unified-auth.ts for authentication
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { requireAuthenticatedProducer, ProducerAuth } from "../_shared/unified-auth.ts";

// ==========================================
// TYPES
// ==========================================

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

interface Affiliation {
  id: string;
  status: string;
}

interface ProfileData {
  asaas_wallet_id: string | null;
  mercadopago_collector_id: string | null;
  stripe_account_id: string | null;
}

// ==========================================
// RATE LIMITING CONFIG
// ==========================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 solicitações por minuto

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

    // ==========================================
    // AUTENTICAÇÃO VIA unified-auth.ts
    // ==========================================
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

    // ==========================================
    // 0. RATE LIMITING - Prevenir abuso
    // ==========================================
    const rateLimitResult = await checkRateLimit(supabaseClient, producer.id);
    if (!rateLimitResult.allowed) {
      console.warn(`🚫 [request-affiliation] Rate limit excedido para ${maskEmail(producer.email)}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Muitas solicitações. Tente novamente em ${rateLimitResult.retryAfterSeconds} segundos.`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    // Registrar tentativa
    await recordRateLimitAttempt(supabaseClient, producer.id);

    // ==========================================
    // 1. BUSCAR PROFILE DO USUÁRIO PARA VALIDAR GATEWAYS
    // ==========================================
    const { data: userProfile } = await supabaseClient
      .from("profiles")
      .select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
      .eq("id", producer.id)
      .single();

    const profileData = userProfile as ProfileData | null;

    console.log(`✅ [request-affiliation] Conexões do usuário: Asaas=${!!profileData?.asaas_wallet_id}, MP=${!!profileData?.mercadopago_collector_id}, Stripe=${!!profileData?.stripe_account_id}`);

    // ==========================================
    // 2. BUSCAR PRODUTO E VALIDAR PROGRAMA
    // ==========================================
    const { data: product, error: productError } = await supabaseClient
      .from("products")
      .select("id, name, user_id, affiliate_settings, affiliate_gateway_settings")
      .eq("id", product_id)
      .maybeSingle();

    if (productError || !product) {
      throw new Error("Produto não encontrado");
    }

    const typedProduct = product as Product;

    // ==========================================
    // 🔒 SEGURANÇA: BLOQUEAR AUTO-AFILIAÇÃO
    // ==========================================
    if (typedProduct.user_id === producer.id) {
      console.warn(`🚫 [request-affiliation] Tentativa de auto-afiliação bloqueada: ${maskEmail(producer.email)}`);
      throw new Error("Você não pode se afiliar ao seu próprio produto");
    }

    // Verificar se o programa de afiliados está ativo
    const affiliateSettings: AffiliateSettings = typedProduct.affiliate_settings || {};
    const programEnabled = affiliateSettings.enabled || false;

    if (!programEnabled) {
      throw new Error("O programa de afiliados não está ativo para este produto");
    }

    // Verificar configurações de gateway do produto (informativo, NÃO bloqueia)
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

    console.log(`ℹ️ [request-affiliation] Gateway status: PIX=${hasAllowedPixGateway}, Card=${hasAllowedCardGateway} (não bloqueia afiliação)`);
    console.log(`✅ [request-affiliation] Programa ativo para produto: ${typedProduct.name}`);

    // ==========================================
    // 3. VALIDAR SE JÁ É AFILIADO
    // ==========================================
    const { data: existingAffiliation } = await supabaseClient
      .from("affiliates")
      .select("id, status")
      .eq("product_id", product_id)
      .eq("user_id", producer.id)
      .maybeSingle();

    const typedAffiliation = existingAffiliation as Affiliation | null;

    if (typedAffiliation) {
      if (typedAffiliation.status === "active") {
        throw new Error("Você já é um afiliado ativo deste produto");
      } else if (typedAffiliation.status === "pending") {
        throw new Error("Você já possui uma solicitação pendente para este produto");
      } else if (typedAffiliation.status === "blocked") {
        throw new Error("Você foi bloqueado e não pode se afiliar a este produto");
      }
      // status === "rejected" permite reenviar
      console.log(`🔄 [request-affiliation] Reenviando solicitação previamente recusada`);
    }

    // ==========================================
    // 4. CRIAR OU ATUALIZAR AFILIAÇÃO
    // ==========================================
    const requireApproval = affiliateSettings.requireApproval || false;
    const initialStatus = requireApproval ? "pending" : "active";
    const affiliateCode = generateSecureAffiliateCode();

    let affiliation;

    if (typedAffiliation && typedAffiliation.status === "rejected") {
      // Atualizar registro existente
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
      // Criar novo registro
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

    // ==========================================
    // 5. RETORNAR RESPOSTA
    // ==========================================
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

// ==========================================
// 🔒 HELPER: Gerar código de afiliado SEGURO (crypto)
// ==========================================
function generateSecureAffiliateCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `AFF-${hex.slice(0, 8)}-${hex.slice(8, 16)}`;
}

// ==========================================
// 🔒 HELPER: Mascarar PII (email) em logs
// ==========================================
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***';
  const [user, domain] = email.split('@');
  const maskedUser = user.length > 2 ? user.substring(0, 2) + '***' : '***';
  return `${maskedUser}@${domain}`;
}

// ==========================================
// 🔒 RATE LIMITING: Verificar limite
// ==========================================
async function checkRateLimit(
  supabase: SupabaseClient, 
  userId: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  const { count, error } = await supabase
    .from("rate_limit_attempts")
    .select("*", { count: "exact", head: true })
    .eq("identifier", `affiliation:${userId}`)
    .eq("action", "request-affiliation")
    .gte("created_at", windowStart);

  if (error) {
    console.error("Erro ao verificar rate limit:", error);
    return { allowed: true };
  }

  const currentCount = count || 0;
  
  if (currentCount >= RATE_LIMIT_MAX_REQUESTS) {
    return { 
      allowed: false, 
      retryAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) 
    };
  }

  return { allowed: true };
}

// ==========================================
// 🔒 RATE LIMITING: Registrar tentativa
// ==========================================
async function recordRateLimitAttempt(supabase: SupabaseClient, userId: string): Promise<void> {
  await supabase
    .from("rate_limit_attempts")
    .insert({
      identifier: `affiliation:${userId}`,
      action: "request-affiliation",
      success: true,
    });
}
