/**
 * manage-affiliation Edge Function
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant (Vertical Slice Architecture)
 * - Uses Shared Kernel for crypto and PII masking
 * - Zero duplicate code
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCanHaveAffiliates } from "../_shared/role-validator.ts";
import { handleCors } from "../_shared/cors.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiter.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { generateSecureAffiliateCode } from "../_shared/kernel/security/crypto-utils.ts";
import { maskEmail } from "../_shared/kernel/security/pii-masking.ts";

// ============================================
// TYPES
// ============================================

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

type ManageAction = "approve" | "reject" | "block" | "unblock" | "update_commission";

// ============================================
// CONSTANTS
// ============================================

const MAX_COMMISSION_RATE = 90;

const ACTION_MESSAGES: Record<ManageAction, string> = {
  approve: "Afiliado aprovado com sucesso!",
  reject: "Afiliado recusado.",
  block: "Afiliado bloqueado.",
  unblock: "Afiliado desbloqueado e ativado.",
  update_commission: "Taxa de comissão atualizada",
};

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  // CORS handling
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

    // Rate limiting
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

    const validActions: ManageAction[] = ["approve", "reject", "block", "unblock", "update_commission"];
    if (!validActions.includes(action)) {
      throw new Error("Ação inválida. Use: approve, reject, block, unblock ou update_commission");
    }
    
    // Validate commission rate for update_commission action
    if (action === "update_commission") {
      if (typeof commission_rate !== 'number' || commission_rate < 1 || commission_rate > MAX_COMMISSION_RATE) {
        throw new Error(`Taxa de comissão deve ser um número entre 1 e ${MAX_COMMISSION_RATE}`);
      }
    }

    // Authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabaseClient, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // Role validation
    await requireCanHaveAffiliates(
      supabaseClient,
      producer.id,
      "manage_affiliation",
      req
    );

    console.log(`🔧 [manage-affiliation] ${maskEmail(producer.email || '')} executando ação: ${action} em ${affiliation_id}`);

    // ============================================
    // FETCH AFFILIATION AND VALIDATE OWNERSHIP
    // ============================================
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
    
    // Verify user owns the product
    if (product.user_id !== producer.id) {
      throw new Error("Você não tem permissão para gerenciar este afiliado");
    }

    console.log(`✅ [manage-affiliation] Validação OK. Produto: ${product.name}`);

    // ============================================
    // EXECUTE ACTION
    // ============================================
    let newStatus: string;
    let affiliateCode: string | null = typedAffiliation.affiliate_code;
    let newCommissionRate: number | null = null;

    switch (action) {
      case "approve":
        newStatus = "active";
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
        if (!affiliateCode) {
          affiliateCode = generateSecureAffiliateCode();
        }
        break;
      
      case "update_commission":
        newStatus = typedAffiliation.status;
        newCommissionRate = commission_rate;
        console.log(`💰 [manage-affiliation] Atualizando comissão para ${commission_rate}%`);
        break;
      
      default:
        throw new Error("Ação não implementada");
    }

    // Build update object
    const updateData: Record<string, string | number | null> = {
      status: newStatus,
      affiliate_code: affiliateCode,
      updated_at: new Date().toISOString(),
    };
    
    if (newCommissionRate !== null) {
      updateData.commission_rate = newCommissionRate;
    }

    // Update in database
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

    // ============================================
    // AUDIT LOG
    // ============================================
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
      console.error(`⚠️ [manage-affiliation] Erro ao registrar audit log:`, auditError);
    }

    // ============================================
    // RETURN RESPONSE
    // ============================================
    const typedAction = action as ManageAction;
    const message = action === "update_commission" 
      ? `${ACTION_MESSAGES[typedAction]} para ${commission_rate}%`
      : ACTION_MESSAGES[typedAction];

    return new Response(
      JSON.stringify({
        success: true,
        affiliation: updated,
        message,
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
