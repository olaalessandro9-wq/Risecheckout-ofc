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
 * @version 2.1.0 - RISE Protocol V3 Compliance (Modularized)
 * @module create-order/handlers/affiliate
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  calculatePlatformFeeCents,
  getVendorFeePercent,
  isVendorOwner,
} from "../../../_shared/platform-config.ts";
import { maskEmail } from "../../../_shared/kernel/security/pii-masking.ts";
import { createLogger } from "../../../_shared/logger.ts";

const log = createLogger("affiliate-processor");
import type {
  AffiliateInput,
  AffiliateResult,
  AffiliateSettings,
  AffiliateRecord,
  AffiliateUserData,
} from "./types.ts";

// Re-export types for external consumers
export type { SplitData, AffiliateResult, AffiliateInput } from "./types.ts";

// Import constant
const MAX_RATE = 90;

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
    allOrderItems,
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
    platformFeeCents = 0;
    netAmountCents = amountInCents;
    log.info("Owner venda direta - Taxa 0%");
  } else if (isOwner && hasActiveAffiliate) {
    platformFeeCents = calculatePlatformFeeCents(amountInCents, vendorFeePercent);
    netAmountCents = amountInCents - platformFeeCents;
    log.info(`Owner + Afiliado - Taxa ${vendorFeePercent * 100}%`);
  } else {
    platformFeeCents = calculatePlatformFeeCents(amountInCents, vendorFeePercent);
    netAmountCents = amountInCents - platformFeeCents;
    log.info(`Vendedor - Taxa ${vendorFeePercent * 100}%`);
  }

  // Configurações de afiliados
  let defaultRate = affiliateSettings.defaultRate || 50;
  const requireApproval = affiliateSettings.requireApproval || false;

  // Segurança: Limite máximo de comissão
  if (defaultRate > MAX_RATE) {
    log.warn(`Taxa ${defaultRate}% limitada a ${MAX_RATE}%`);
    defaultRate = MAX_RATE;
  }

  log.info(`Programa: ${affiliateProgramEnabled}, Taxa: ${defaultRate}%`);

  // Processar afiliado se existir
  if (affiliate_code && affiliateProgramEnabled) {
    const result = await processAffiliateCode(
      supabase,
      affiliate_code,
      product_id,
      customer_email,
      affiliateSettings,
      defaultRate,
      requireApproval,
      amountInCents,
      netAmountCents,
      discountAmount,
      totalAmount,
      allOrderItems
    );

    affiliateId = result.affiliateId;
    commissionCents = result.commissionCents;
    affiliateWalletId = result.affiliateWalletId;
  } else if (affiliate_code && !affiliateProgramEnabled) {
    log.warn("Programa desativado");
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
      affiliateCommissionCents: commissionCents,
    },
  };
}

/**
 * Process affiliate code and calculate commission
 */
async function processAffiliateCode(
  supabase: SupabaseClient,
  affiliate_code: string,
  product_id: string,
  customer_email: string,
  affiliateSettings: AffiliateSettings,
  defaultRate: number,
  requireApproval: boolean,
  amountInCents: number,
  netAmountCents: number,
  discountAmount: number,
  totalAmount: number,
  allOrderItems: AffiliateInput["allOrderItems"]
): Promise<{ affiliateId: string | null; commissionCents: number; affiliateWalletId: string | null }> {
  log.info(`Buscando código: ${affiliate_code}`);

  const { data: affiliate } = (await supabase
    .from("affiliates")
    .select(`
      id, user_id, commission_rate, status, pix_gateway, credit_card_gateway, gateway_credentials,
      profiles:user_id(asaas_wallet_id, mercadopago_collector_id, stripe_account_id)
    `)
    .eq("affiliate_code", affiliate_code)
    .eq("product_id", product_id)
    .maybeSingle()) as { data: AffiliateRecord | null };

  if (!affiliate) {
    log.warn(`Código não encontrado: ${affiliate_code}`);
    return { affiliateId: null, commissionCents: 0, affiliateWalletId: null };
  }

  // Extract wallet IDs
  const walletIds = extractWalletIds(affiliate);

  // Verificar status
  if (requireApproval && affiliate.status !== "active") {
    log.warn(`Aguardando aprovação: ${affiliate_code}`);
    return { affiliateId: null, commissionCents: 0, affiliateWalletId: null };
  }

  if (affiliate.status !== "active") {
    log.warn(`Status inválido: ${affiliate.status}`);
    return { affiliateId: null, commissionCents: 0, affiliateWalletId: null };
  }

  // Determine wallet based on gateway
  const affiliateWalletId = determineWallet(affiliate, walletIds);

  // Anti-Self-Referral check
  const isSelfReferral = await checkSelfReferral(supabase, affiliate.user_id, customer_email);
  if (isSelfReferral) {
    log.warn(`Auto-indicação detectada: ${maskEmail(customer_email)}`);
    return { affiliateId: null, commissionCents: 0, affiliateWalletId: null };
  }

  // Calculate commission
  const commissionCents = calculateCommission(
    affiliate,
    affiliateSettings,
    defaultRate,
    amountInCents,
    netAmountCents,
    discountAmount,
    totalAmount,
    allOrderItems
  );

  return { affiliateId: affiliate.id, commissionCents, affiliateWalletId };
}

/**
 * Extract wallet IDs from affiliate's profile (Single Source of Truth)
 * 
 * RISE V3 Solution D: Affiliates inherit credentials from their profiles table.
 * The affiliates.gateway_credentials column is DEPRECATED.
 */
function extractWalletIds(affiliate: AffiliateRecord) {
  const profile = affiliate.profiles;
  return {
    asaas: profile?.asaas_wallet_id || null,
    mercadopago: profile?.mercadopago_collector_id || null,
    stripe: profile?.stripe_account_id || null,
  };
}

function determineWallet(
  affiliate: AffiliateRecord,
  walletIds: { asaas: string | null; mercadopago: string | null; stripe: string | null }
): string | null {
  const gateway = affiliate.pix_gateway || "asaas";

  if (gateway === "asaas") return walletIds.asaas;
  if (gateway === "mercadopago") return walletIds.mercadopago;

  return null;
}

async function checkSelfReferral(
  supabase: SupabaseClient,
  userId: string,
  customerEmail: string
): Promise<boolean> {
  const { data } = (await supabase.auth.admin.getUserById(userId)) as { data: AffiliateUserData | null };
  const affiliateEmail = data?.user?.email?.toLowerCase();
  return affiliateEmail === customerEmail.toLowerCase();
}

function calculateCommission(
  affiliate: AffiliateRecord,
  affiliateSettings: AffiliateSettings,
  defaultRate: number,
  amountInCents: number,
  netAmountCents: number,
  discountAmount: number,
  totalAmount: number,
  allOrderItems: AffiliateInput["allOrderItems"]
): number {
  const rules = {
    mainProduct: true,
    orderBump: affiliateSettings.commissionOnOrderBump ?? affiliateSettings.allowUpsells ?? false,
    upsell: affiliateSettings.commissionOnUpsell ?? affiliateSettings.allowUpsells ?? false,
  };

  log.info(`Regras: Bump=${rules.orderBump}`);

  let commissionableGrossAmount = 0;
  for (const item of allOrderItems) {
    const isCommissionable = item.is_bump ? rules.orderBump : rules.mainProduct;
    if (isCommissionable) commissionableGrossAmount += item.amount_cents;
  }

  if (discountAmount > 0 && commissionableGrossAmount > 0) {
    const discountRatio = discountAmount / totalAmount;
    commissionableGrossAmount -= Math.round(commissionableGrossAmount * discountRatio);
  }

  const commissionableRatio = amountInCents > 0 ? commissionableGrossAmount / amountInCents : 0;
  const commissionableNetAmount = Math.round(netAmountCents * commissionableRatio);

  let commissionRate = affiliate.commission_rate ?? defaultRate ?? 50;
  if (commissionRate > 90) {
    log.warn(`Taxa ${commissionRate}% limitada`);
    commissionRate = 90;
  }

  const commissionCents = Math.round(commissionableNetAmount * (commissionRate / 100));

  log.info(`MODELO CAKTO:`);
  log.info(`  - Bruto comissionável: R$ ${(commissionableGrossAmount / 100).toFixed(2)}`);
  log.info(`  - Líquido comissionável: R$ ${(commissionableNetAmount / 100).toFixed(2)}`);
  log.info(`  - Comissão (${commissionRate}%): R$ ${(commissionCents / 100).toFixed(2)}`);

  return commissionCents;
}
