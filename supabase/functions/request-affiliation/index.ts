import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://risecheckout.com",
  "https://www.risecheckout.com",
  "https://risecheckout-84776.lovable.app",
  "https://prime-checkout-hub.lovable.app"
];

const getCorsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
});

// ==========================================
// RATE LIMITING CONFIG
// ==========================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 solicitações por minuto

serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Setup Supabase Client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse body
    const { product_id } = await req.json();

    if (!product_id) {
      throw new Error("product_id é obrigatório");
    }

    // ==========================================
    // AUTENTICAÇÃO VIA PRODUCER SESSION (token customizado)
    // ==========================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Usuário não autenticado");
    }

    const sessionToken = authHeader.replace("Bearer ", "");

    // Validar token customizado na tabela producer_sessions
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from("producer_sessions")
      .select(`
        producer_id,
        expires_at,
        is_valid,
        profiles:producer_id (
          id,
          email,
          asaas_wallet_id,
          mercadopago_collector_id,
          stripe_account_id
        )
      `)
      .eq("session_token", sessionToken)
      .eq("is_valid", true)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !sessionData || !sessionData.profiles) {
      console.error(`🚨 [request-affiliation] Sessão inválida ou expirada. Error: ${sessionError?.message || 'No session data'}`);
      throw new Error("Sessão inválida ou expirada. Faça login novamente.");
    }

    // Extrair dados do usuário e profile
    const user = {
      id: sessionData.producer_id,
      email: (sessionData.profiles as any).email,
    };

    // userProfile já obtido na validação da sessão
    const userProfile = sessionData.profiles as any;

    console.log(`📝 [request-affiliation] Solicitação de ${maskEmail(user.email || '')} para produto ${product_id}`);

    // ==========================================
    // 0. RATE LIMITING - Prevenir abuso
    // ==========================================
    const rateLimitResult = await checkRateLimit(supabaseClient, user.id);
    if (!rateLimitResult.allowed) {
      console.warn(`🚫 [request-affiliation] Rate limit excedido para ${maskEmail(user.email || '')}`);
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
    await recordRateLimitAttempt(supabaseClient, user.id);

    // ==========================================
    // 1. VALIDAR GATEWAYS DO USUÁRIO (userProfile já obtido na autenticação)
    // ==========================================
    // Verificar se tem pelo menos uma conexão de gateway
    const hasAnyGateway = !!(
      userProfile?.asaas_wallet_id || 
      userProfile?.mercadopago_collector_id || 
      userProfile?.stripe_account_id
    );

    console.log(`✅ [request-affiliation] Conexões do usuário: Asaas=${!!userProfile?.asaas_wallet_id}, MP=${!!userProfile?.mercadopago_collector_id}, Stripe=${!!userProfile?.stripe_account_id}`);

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

    // ==========================================
    // 🔒 SEGURANÇA: BLOQUEAR AUTO-AFILIAÇÃO
    // ==========================================
    if (product.user_id === user.id) {
      console.warn(`🚫 [request-affiliation] Tentativa de auto-afiliação bloqueada: ${maskEmail(user.email || '')}`);
      throw new Error("Você não pode se afiliar ao seu próprio produto");
    }

    // Verificar se o programa de afiliados está ativo
    const affiliateSettings = (product.affiliate_settings as any) || {};
    const programEnabled = affiliateSettings.enabled || false;

    if (!programEnabled) {
      throw new Error("O programa de afiliados não está ativo para este produto");
    }

    // Verificar configurações de gateway do produto
    const gatewaySettings = (product.affiliate_gateway_settings as any) || {};
    const pixAllowed = gatewaySettings.pix_allowed || ["asaas"];
    const cardAllowed = gatewaySettings.credit_card_allowed || ["mercadopago", "stripe"];

    // LOG: Verificar gateways permitidos pelo produto (informativo, NÃO bloqueia)
    const hasAllowedPixGateway = (
      (pixAllowed.includes("asaas") && userProfile?.asaas_wallet_id) ||
      (pixAllowed.includes("mercadopago") && userProfile?.mercadopago_collector_id) ||
      (pixAllowed.includes("pushinpay")) // PushinPay usa credenciais da plataforma
    );
    
    const hasAllowedCardGateway = (
      (cardAllowed.includes("mercadopago") && userProfile?.mercadopago_collector_id) ||
      (cardAllowed.includes("stripe") && userProfile?.stripe_account_id)
    );

    // Apenas log informativo - afiliação é permitida sem gateway configurado
    // O link de afiliado só será exibido quando o usuário configurar os gateways
    console.log(`ℹ️ [request-affiliation] Gateway status: PIX=${hasAllowedPixGateway}, Card=${hasAllowedCardGateway} (não bloqueia afiliação)`);

    console.log(`✅ [request-affiliation] Programa ativo para produto: ${product.name}`);

    // ==========================================
    // 3. VALIDAR SE JÁ É AFILIADO
    // ==========================================
    const { data: existingAffiliation } = await supabaseClient
      .from("affiliates")
      .select("id, status")
      .eq("product_id", product_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingAffiliation) {
      if (existingAffiliation.status === "active") {
        throw new Error("Você já é um afiliado ativo deste produto");
      } else if (existingAffiliation.status === "pending") {
        throw new Error("Você já possui uma solicitação pendente para este produto");
      } else if (existingAffiliation.status === "blocked") {
        throw new Error("Você foi bloqueado e não pode se afiliar a este produto");
      } else if (existingAffiliation.status === "rejected") {
        // Permite reenviar se foi recusado anteriormente
        console.log(`🔄 [request-affiliation] Reenviando solicitação previamente recusada`);
      }
    }

    // ==========================================
    // 4. CRIAR OU ATUALIZAR AFILIAÇÃO
    // ==========================================
    const requireApproval = affiliateSettings.requireApproval || false;
    const defaultRate = affiliateSettings.defaultRate || 50;

    // Status inicial e código seguro
    // ✅ FIX: Sempre gerar código (coluna NOT NULL), mesmo para status pending
    const initialStatus = requireApproval ? "pending" : "active";
    const affiliateCode = generateSecureAffiliateCode();

    let affiliation;

    if (existingAffiliation && existingAffiliation.status === "rejected") {
      // Atualizar registro existente
      const { data, error } = await supabaseClient
        .from("affiliates")
        .update({
          status: initialStatus,
          affiliate_code: affiliateCode,
          commission_rate: null, // NULL = herda dinamicamente do produto
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAffiliation.id)
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
          user_id: user.id,
          status: initialStatus,
          affiliate_code: affiliateCode,
          commission_rate: null, // NULL = herda dinamicamente do produto
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

  } catch (error: any) {
    console.error("🚨 [request-affiliation] Erro:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro ao processar solicitação",
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
  supabase: any, 
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
    // Em caso de erro, permitir (fail-open para não bloquear usuários legítimos)
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
async function recordRateLimitAttempt(supabase: any, userId: string): Promise<void> {
  await supabase
    .from("rate_limit_attempts")
    .insert({
      identifier: `affiliation:${userId}`,
      action: "request-affiliation",
      success: true,
    });
}