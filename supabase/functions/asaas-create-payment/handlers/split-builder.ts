/**
 * Split Builder Handler - asaas-create-payment
 * 
 * Responsável por montar as regras de split do marketplace
 */

import { 
  calculatePlatformFeeCents,
  PLATFORM_FEE_PERCENT 
} from "../../_shared/platform-config.ts";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("asaas-create-payment");

export interface AsaasSplitRule {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
}

export interface SplitData {
  isOwner: boolean;
  hasAffiliate: boolean;
  affiliateWalletId?: string | null;
  affiliateCommissionPercent: number;
  vendorWalletId?: string | null;
}

export interface SplitResult {
  splitRules: AsaasSplitRule[];
  platformFeeCents: number;
  affiliateCommissionCents: number;
  vendorNetCents: number;
  error?: string;
}

/**
 * Monta as regras de split baseado nos dados calculados
 */
export function buildSplitRules(
  splitData: SplitData,
  amountCents: number
): SplitResult {
  const splitRules: AsaasSplitRule[] = [];
  let platformFeeCents = 0;
  let affiliateCommissionCents = 0;
  let vendorNetCents = amountCents;

  if (splitData.isOwner) {
    // Cenário 1 ou 2: Owner direto ou Owner + Afiliado
    if (splitData.hasAffiliate && splitData.affiliateWalletId && splitData.affiliateCommissionPercent > 0) {
      // Owner + Afiliado: Afiliado recebe X% * 0.96
      const adjustedAffiliatePercent = splitData.affiliateCommissionPercent * (1 - PLATFORM_FEE_PERCENT);
      
      splitRules.push({
        walletId: splitData.affiliateWalletId,
        percentualValue: adjustedAffiliatePercent
      });
      
      platformFeeCents = calculatePlatformFeeCents(amountCents);
      const netAfterFee = amountCents - platformFeeCents;
      affiliateCommissionCents = Math.floor(netAfterFee * (splitData.affiliateCommissionPercent / 100));
      vendorNetCents = netAfterFee - affiliateCommissionCents;
      
      log.info(`🏠 OWNER + AFILIADO: Split ${adjustedAffiliatePercent.toFixed(2)}%`);
      
    } else if (splitData.hasAffiliate && !splitData.affiliateWalletId) {
      log.warn(`⚠️ Afiliado sem wallet! Venda sem split.`);
    } else {
      log.info(`🏠 OWNER DIRETO: 100% RiseCheckout`);
    }
    
  } else {
    // Cenário 3: Vendedor comum (96% vendedor, 4% plataforma)
    if (!splitData.vendorWalletId) {
      log.error(`❌ Vendedor sem asaas_wallet_id!`);
      return {
        splitRules: [],
        platformFeeCents: 0,
        affiliateCommissionCents: 0,
        vendorNetCents: 0,
        error: 'Configure seu Wallet ID Asaas em Configurações > Financeiro'
      };
    }
    
    splitRules.push({
      walletId: splitData.vendorWalletId,
      percentualValue: 96
    });
    
    platformFeeCents = calculatePlatformFeeCents(amountCents);
    vendorNetCents = amountCents - platformFeeCents;
    
    log.info(`👤 VENDEDOR: 96% → ${splitData.vendorWalletId.substring(0, 15)}...`);
  }

  return {
    splitRules,
    platformFeeCents,
    affiliateCommissionCents,
    vendorNetCents
  };
}
