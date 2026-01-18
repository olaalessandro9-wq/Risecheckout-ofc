/**
 * affiliate-processor.ts - Lógica de Afiliados e Split (Modelo Cakto)
 * 
 * Responsabilidade ÚNICA: Calcular comissões e split de pagamento
 * 
 * MODELO CAKTO (proporcional):
 * 1. Taxa da plataforma é descontada do TOTAL primeiro
 * 2. Comissão do afiliado é calculada sobre o valor LÍQUIDO
 * 3. Produtor recebe o restante do líquido
 * 
 * @version 2.0.0 - RISE Protocol V2 Compliance (Zero any)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  calculatePlatformFeeCents, 
  getVendorFeePercent,
  isVendorOwner
} from "../../_shared/platform-config.ts";
import { maskEmail } from "../../_shared/kernel/security/pii-masking.ts";
import type { OrderItem } from "./bump-processor.ts";
// === INTERFACES (Zero any) ===

export interface SplitData {
  platformFeeCents: number;
  affiliateWalletId: string | null;
  affiliateCommissionCents: number;
}

export interface AffiliateResult {
  affiliateId: string | null;
  commissionCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  affiliateWalletId: string | null;
  splitData: SplitData;
}

interface AffiliateSettings {
  enabled?: boolean;
  defaultRate?: number;
  requireApproval?: boolean;
  commissionOnOrderBump?: boolean;
  commissionOnUpsell?: boolean;
  allowUpsells?: boolean;
}

interface ProductInput {
  user_id: string;
  affiliate_settings: AffiliateSettings | Record<string, unknown>;
}

export interface AffiliateInput {
  product: ProductInput;
  product_id: string;
  affiliate_code?: string;
  customer_email: string;
  amountInCents: number;
  discountAmount: number;
  totalAmount: number;
  allOrderItems: OrderItem[];
}

interface AffiliateProfile {
  asaas_wallet_id: string | null;
  mercadopago_collector_id: string | null;
  stripe_account_id: string | null;
}

interface AffiliateRecord {
  id: string;
  user_id: string;
  commission_rate: number | null;
  status: string;
  pix_gateway: string | null;
  credit_card_gateway: string | null;
  gateway_credentials: Record<string, string> | null;
  profiles: AffiliateProfile | null;
}

interface AffiliateUserData {
  user?: {
    email?: string;
  };
}

// Máximo de comissão permitido (segurança)
const MAX_COMMISSION_RATE = 90;

/**
 * Processa lógica de afiliados e calcula split
 */
export async function processAffiliate(
  supabase: SupabaseClient,
  input: AffiliateInput
): Promise<AffiliateResult> {
  const {
    product,
    product_id,
    affiliate_code,
    customer_email,
    amountInCents,
    discountAmount,
    totalAmount,
    allOrderItems
  } = input;

  let affiliateId: string | null = null;
  let commissionCents = 0;
  let affiliateWalletId: string | null = null;

  // Verificar se vendedor é Owner
  const isOwner = await isVendorOwner(supabase, product.user_id);

  // Verificar programa de afiliados
  const affiliateSettings = (product.affiliate_settings || {}) as AffiliateSettings;
  const affiliateProgramEnabled = affiliateSettings.enabled || false;
  const hasActiveAffiliate = !!affiliate_code && affiliateProgramEnabled;

  // Taxa dinâmica por vendedor
  const vendorFeePercent = await getVendorFeePercent(supabase, product.user_id);

  let platformFeeCents: number;
  let netAmountCents: number;

  // Calcular taxa baseado no contexto
  if (isOwner && !hasActiveAffiliate) {
    // Owner vendendo DIRETO: Taxa ZERO
    platformFeeCents = 0;
    netAmountCents = amountInCents;
    console.log("[affiliate-processor] Owner venda direta - Taxa 0%");
  } else if (isOwner && hasActiveAffiliate) {
    // Owner COM AFILIADO: Taxa calculada para split
    platformFeeCents = calculatePlatformFeeCents(amountInCents, vendorFeePercent);
    netAmountCents = amountInCents - platformFeeCents;
    console.log(`[affiliate-processor] Owner + Afiliado - Taxa ${vendorFeePercent * 100}%`);
  } else {
    // Vendedor comum: Taxa normal
    platformFeeCents = calculatePlatformFeeCents(amountInCents, vendorFeePercent);
    netAmountCents = amountInCents - platformFeeCents;
    console.log(`[affiliate-processor] Vendedor - Taxa ${vendorFeePercent * 100}%`);
  }

  // Configurações de afiliados
  let defaultRate = affiliateSettings.defaultRate || 50;
  const requireApproval = affiliateSettings.requireApproval || false;

  // Segurança: Limite máximo de comissão
  if (defaultRate > MAX_COMMISSION_RATE) {
    console.warn(`[affiliate-processor] Taxa ${defaultRate}% limitada a ${MAX_COMMISSION_RATE}%`);
    defaultRate = MAX_COMMISSION_RATE;
  }

  console.log(`[affiliate-processor] Programa: ${affiliateProgramEnabled}, Taxa: ${defaultRate}%`);

  // Processar afiliado se existir
  if (affiliate_code && affiliateProgramEnabled) {
    console.log(`[affiliate-processor] Buscando código: ${affiliate_code}`);

    // =====================================================
    // OPT-4: Query unificada com JOIN (elimina query separada de profile)
    // ANTES: 2 queries (affiliates + profiles)
    // DEPOIS: 1 query com JOIN
    // =====================================================
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select(`
        id, 
        user_id, 
        commission_rate, 
        status, 
        pix_gateway, 
        credit_card_gateway, 
        gateway_credentials,
        profiles:user_id(
          asaas_wallet_id,
          mercadopago_collector_id,
          stripe_account_id
        )
      `)
      .eq("affiliate_code", affiliate_code)
      .eq("product_id", product_id)
      .maybeSingle() as { data: AffiliateRecord | null };

    // Extrair wallet IDs do profile já carregado via JOIN
    let affiliateWalletFromProfile: string | null = null;
    let affiliateMpCollectorId: string | null = null;
    let affiliateStripeAccountId: string | null = null;
    
    if (affiliate) {
      // Profile já vem no JOIN - sem query adicional
      const affiliateProfile = affiliate.profiles;
      
      affiliateWalletFromProfile = affiliateProfile?.asaas_wallet_id || null;
      affiliateMpCollectorId = affiliateProfile?.mercadopago_collector_id || null;
      affiliateStripeAccountId = affiliateProfile?.stripe_account_id || null;
      
      // Override com gateway_credentials do affiliate se existir
      const credentials = affiliate.gateway_credentials || {};
      if (credentials.asaas_wallet_id) affiliateWalletFromProfile = credentials.asaas_wallet_id;
      if (credentials.mercadopago_collector_id) affiliateMpCollectorId = credentials.mercadopago_collector_id;
      if (credentials.stripe_account_id) affiliateStripeAccountId = credentials.stripe_account_id;
      
      console.log("[affiliate-processor] OPT-4: Profile carregado via JOIN");
    }

    if (affiliate) {
      // Verificar status
      if (requireApproval && affiliate.status !== "active") {
        console.warn(`[affiliate-processor] Aguardando aprovação: ${affiliate_code}`);
      } else if (affiliate.status === "active") {
        // Determinar qual wallet usar baseado no gateway escolhido pelo afiliado
        const affiliatePixGateway = affiliate.pix_gateway || "asaas";
        
        if (affiliatePixGateway === "asaas") {
          affiliateWalletId = affiliateWalletFromProfile;
        } else if (affiliatePixGateway === "mercadopago") {
          // Para MP, usamos collector_id no split
          affiliateWalletId = affiliateMpCollectorId;
        }
        // Stripe usa account_id mas não no mesmo formato de wallet

        if (affiliateWalletId) {
          console.log(`[affiliate-processor] Wallet encontrado para gateway ${affiliatePixGateway}`);
        } else {
          console.warn(`[affiliate-processor] Sem Wallet para ${affiliatePixGateway} - Split não aplicado`);
        }

        // Anti-Self-Referral
        const { data: affiliateUserData } = await supabase.auth.admin.getUserById(affiliate.user_id) as { data: AffiliateUserData | null };
        const affiliateEmail = affiliateUserData?.user?.email?.toLowerCase();
        const isSelfReferral = affiliateEmail === customer_email.toLowerCase();

        if (isSelfReferral) {
          console.warn(`[affiliate-processor] Auto-indicação detectada: ${maskEmail(customer_email)}`);
        } else {
          affiliateId = affiliate.id;

          // Regras de comissão
          const rules = {
            mainProduct: true,
            orderBump: affiliateSettings.commissionOnOrderBump ?? affiliateSettings.allowUpsells ?? false,
            upsell: affiliateSettings.commissionOnUpsell ?? affiliateSettings.allowUpsells ?? false
          };

          console.log(`[affiliate-processor] Regras: Bump=${rules.orderBump}`);

          // Calcular proporção de itens comissionáveis
          let commissionableGrossAmount = 0;
          for (const item of allOrderItems) {
            const isCommissionable = item.is_bump ? rules.orderBump : rules.mainProduct;
            if (isCommissionable) {
              commissionableGrossAmount += item.amount_cents;
            }
          }

          // Subtrair descontos proporcionais
          if (discountAmount > 0 && commissionableGrossAmount > 0) {
            const discountRatio = discountAmount / totalAmount;
            commissionableGrossAmount -= Math.round(commissionableGrossAmount * discountRatio);
          }

          // MODELO CAKTO: Proporção aplicada ao líquido
          const commissionableRatio = amountInCents > 0 ? commissionableGrossAmount / amountInCents : 0;
          const commissionableNetAmount = Math.round(netAmountCents * commissionableRatio);

          // Calcular comissão final
          let commissionRate = affiliate.commission_rate ?? defaultRate ?? 50;
          if (commissionRate > MAX_COMMISSION_RATE) {
            console.warn(`[affiliate-processor] Taxa ${commissionRate}% limitada`);
            commissionRate = MAX_COMMISSION_RATE;
          }
          commissionCents = Math.round(commissionableNetAmount * (commissionRate / 100));

          console.log(`[affiliate-processor] MODELO CAKTO:`);
          console.log(`  - Bruto comissionável: R$ ${(commissionableGrossAmount / 100).toFixed(2)}`);
          console.log(`  - Líquido comissionável: R$ ${(commissionableNetAmount / 100).toFixed(2)}`);
          console.log(`  - Comissão (${commissionRate}%): R$ ${(commissionCents / 100).toFixed(2)}`);
        }
      } else {
        console.warn(`[affiliate-processor] Status inválido: ${affiliate.status}`);
      }
    } else {
      console.warn(`[affiliate-processor] Código não encontrado: ${affiliate_code}`);
    }
  } else if (affiliate_code && !affiliateProgramEnabled) {
    console.warn("[affiliate-processor] Programa desativado");
  }

  return {
    affiliateId,
    commissionCents,
    platformFeeCents,
    netAmountCents,
    affiliateWalletId,
    splitData: {
      platformFeeCents,
      affiliateWalletId,
      affiliateCommissionCents: commissionCents
    }
  };
}
