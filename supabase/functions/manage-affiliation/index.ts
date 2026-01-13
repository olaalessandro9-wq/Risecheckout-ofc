/**
 * manage-affiliation Edge Function
 * 
 * @version 2.0.0 - Zero `any` compliance (RISE Protocol V2)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCanHaveAffiliates } from "../_shared/role-validator.ts";
import { logSecurityEvent, SecurityAction } from "../_shared/audit-logger.ts";
import { handleCors } from "../_shared/cors.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiter.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// ==========================================
// 🔒 TYPES
// ==========================================

interface AffiliationProduct {
  id: string;
  name: string;
  user_id: string;
}

interface Affiliation {
  id: string;
  status: string;
  user_id: string;
  product_id: string;
  affiliate_code: string | null;
  products: AffiliationProduct | AffiliationProduct[];
}

// ==========================================
// 🔒 CONSTANTES DE SEGURANÇA
// ==========================================
const MAX_COMMISSION_RATE = 90; // Limite máximo de comissão (previne 99%+)

serve(async (req) => {
  // SECURITY: Validação CORS centralizada
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

    // SECURITY: Rate limiting para gerenciamento de afiliados
    const rateLimitResult = await rateLimitMiddleware(
      supabaseClient,
      req,
      RATE_LIMIT_CONFIGS.AFFILIATION_MANAGE
    );
    if (rateLimitResult) {
      console.warn(`[manage-affiliation] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    // Parse body
    const { affiliation_id, action, commission_rate } = await req.json();

    if (!affiliation_id || !action) {
      throw new Error("affiliation_id e action são obrigatórios");
    }

    if (!["approve", "reject", "block", "unblock", "update_commission"].includes(action)) {
      throw new Error("Ação inválida. Use: approve, reject, block, unblock ou update_commission");
    }
    
    // Validação específica para update_commission
    if (action === "update_commission") {
      if (typeof commission_rate !== 'number' || commission_rate < 1 || commission_rate > MAX_COMMISSION_RATE) {
        throw new Error(`Taxa de comissão deve ser um número entre 1 e ${MAX_COMMISSION_RATE}`);
      }
    }

    // Get authenticated producer via unified-auth
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabaseClient, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // ==========================================
    // 🔒 VALIDAÇÃO DE ROLE - SEGURANÇA CRÍTICA
    // ==========================================
    // Apenas owner/admin podem gerenciar afiliados
    await requireCanHaveAffiliates(
      supabaseClient,
      producer.id,
      "manage_affiliation",
      req
    );

    console.log(`🔧 [manage-affiliation] ${maskEmail(producer.email || '')} executando ação: ${action} em ${affiliation_id}`);

    // ==========================================
    // 1. BUSCAR AFILIAÇÃO E VALIDAR PROPRIEDADE
    // ==========================================
    const { data: affiliation, error: fetchError } = await supabaseClient
      .from("affiliates")
      .select(`
        id,
        status,
        user_id,
        product_id,
        affiliate_code,
        products (
          id,
          name,
          user_id
        )
      `)
      .eq("id", affiliation_id)
      .maybeSingle();

    if (fetchError || !affiliation) {
      throw new Error("Afiliação não encontrada");
    }

    const typedAffiliation = affiliation as unknown as Affiliation;
    
    // Handle products that could be array or object
    const productsData = typedAffiliation.products;
    const product: AffiliationProduct = Array.isArray(productsData) ? productsData[0] : productsData;
    
    // Verificar se o usuário autenticado é o dono do produto
    if (product.user_id !== producer.id) {
      throw new Error("Você não tem permissão para gerenciar este afiliado");
    }

    console.log(`✅ [manage-affiliation] Validação OK. Produto: ${product.name}`);

    // ==========================================
    // 2. EXECUTAR AÇÃO
    // ==========================================
    let newStatus: string;
    let affiliateCode: string | null = typedAffiliation.affiliate_code;
    let newCommissionRate: number | null = null;

    switch (action) {
      case "approve":
        newStatus = "active";
        // Gerar código se não existir
        if (!affiliateCode) {
          affiliateCode = generateSecureAffiliateCode();
        }
        break;
      
      case "reject":
        newStatus = "rejected";
        break;
      
      case "block":
        newStatus = "blocked";
        break;
      
      case "unblock":
        newStatus = "active";
        // Gerar código se não existir
        if (!affiliateCode) {
          affiliateCode = generateSecureAffiliateCode();
        }
        break;
      
      case "update_commission":
        // Não muda status, apenas atualiza taxa
        newStatus = typedAffiliation.status;
        newCommissionRate = commission_rate;
        console.log(`💰 [manage-affiliation] Atualizando comissão para ${commission_rate}%`);
        break;
      
      default:
        throw new Error("Ação não implementada");
    }

    // Montar objeto de update
    const updateData: Record<string, string | number | null> = {
      status: newStatus,
      affiliate_code: affiliateCode,
      updated_at: new Date().toISOString(),
    };
    
    // Adicionar commission_rate se foi alterada
    if (newCommissionRate !== null) {
      updateData.commission_rate = newCommissionRate;
    }

    // Atualizar no banco
    const { data: updated, error: updateError } = await supabaseClient
      .from("affiliates")
      .update(updateData)
      .eq("id", affiliation_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ [manage-affiliation] Status atualizado: ${typedAffiliation.status} → ${newStatus}`);

    // ==========================================
    // 3. REGISTRAR AUDIT LOG
    // ==========================================
    try {
      await supabaseClient.from("affiliate_audit_log").insert({
        affiliate_id: affiliation_id,
        action: action,
        performed_by: producer.id,
        previous_status: typedAffiliation.status,
        new_status: newStatus,
        metadata: {
          product_id: typedAffiliation.product_id,
          product_name: product.name
        },
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null
      });
      console.log(`📝 [manage-affiliation] Audit log registrado: ${action}`);
    } catch (auditError: unknown) {
      // Não falhar se audit log falhar - apenas logar
      console.error(`⚠️ [manage-affiliation] Erro ao registrar audit log:`, auditError);
    }

    // ==========================================
    // 4. RETORNAR RESPOSTA
    // ==========================================
    const messages: Record<string, string> = {
      approve: "Afiliado aprovado com sucesso!",
      reject: "Afiliado recusado.",
      block: "Afiliado bloqueado.",
      unblock: "Afiliado desbloqueado e ativado.",
      update_commission: `Taxa de comissão atualizada para ${commission_rate}%`,
    };

    return new Response(
      JSON.stringify({
        success: true,
        affiliation: updated,
        message: messages[action],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("🚨 [manage-affiliation] Erro:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage || "Erro ao processar ação",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

// ==========================================
// HELPER: Gerar código de afiliado único (SEGURO)
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
