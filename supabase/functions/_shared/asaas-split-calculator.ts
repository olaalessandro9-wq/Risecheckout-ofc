/**
 * Asaas Split Calculator
 * 
 * Módulo responsável por calcular dados de split para o modelo Marketplace.
 * 
 * RISE Protocol V3 - 10.0/10 Compliant
 * Uses 'users' table as SSOT for wallet queries
 * 
 * MODELO MARKETPLACE:
 * - Todas cobranças na conta RiseCheckout
 * - Split BINÁRIO (nunca 3 partes)
 * - Owner vendendo direto: 100% RiseCheckout
 * - Owner + Afiliado: Afiliado recebe X% * 0.96, Owner recebe resto
 * - Vendedor comum: 96% vendedor, 4% plataforma
 * 
 * @module _shared/asaas-split-calculator
 * @version 2.0.0 - Migrated from profiles to users (SSOT)
 */

import { SupabaseClient } from "./supabase-types.ts";
import { isVendorOwner } from "./platform-config.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("AsaasSplitCalculator");

// ============================================
// TYPES
// ============================================

/**
 * Dados de split calculados
 */
export interface CalculatedSplitData {
  isOwner: boolean;
  hasAffiliate: boolean;
  affiliateId: string | null;
  affiliateUserId: string | null;
  affiliateWalletId: string | null;
  affiliateCommissionPercent: number;
  vendorWalletId: string | null;
}

interface OrderData {
  affiliate_id: string | null;
}

interface AffiliateData {
  user_id: string;
  commission_rate: number | null;
  product_id: string;
}

interface ProductAffiliateSettings {
  affiliate_settings?: {
    defaultRate?: number;
  } | null;
}

interface UserData {
  asaas_wallet_id: string | null;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Calcula os dados de split para uma ordem no modelo Marketplace.
 * 
 * RISE V3: Uses 'users' table as SSOT for wallet queries
 * 
 * @param supabase - Cliente Supabase com service role
 * @param orderId - ID da ordem
 * @param vendorId - ID do vendedor
 * @returns Dados calculados para split
 */
export async function calculateMarketplaceSplitData(
  supabase: SupabaseClient,
  orderId: string,
  vendorId: string
): Promise<CalculatedSplitData> {
  log.info("Processing split calculation", { orderId, vendorId });
  
  const result: CalculatedSplitData = {
    isOwner: false,
    hasAffiliate: false,
    affiliateId: null,
    affiliateUserId: null,
    affiliateWalletId: null,
    affiliateCommissionPercent: 0,
    vendorWalletId: null
  };

  // 1. Verificar se é Owner
  result.isOwner = await isVendorOwner(supabase, vendorId);
  log.debug("Owner check result", { isOwner: result.isOwner });

  // 2. Buscar ordem para verificar afiliado
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('affiliate_id')
    .eq('id', orderId)
    .single();
  
  if (orderError) {
    log.error("Error fetching order:", orderError);
    return result;
  }

  const order = orderData as OrderData | null;

  // 3. Se tem afiliado, buscar dados
  if (order?.affiliate_id) {
    result.hasAffiliate = true;
    result.affiliateId = order.affiliate_id;
    
    const { data: affiliateData } = await supabase
      .from('affiliates')
      .select('user_id, commission_rate, product_id')
      .eq('id', order.affiliate_id)
      .single();
    
    const affiliate = affiliateData as AffiliateData | null;
    
    if (affiliate) {
      result.affiliateUserId = affiliate.user_id;
      
      // ========================================
      // FIX: Se commission_rate é null, usar defaultRate do produto
      // ========================================
      let commissionRate = affiliate.commission_rate;
      
      if (commissionRate === null || commissionRate === undefined) {
        // Buscar defaultRate das configurações do produto
        const { data: productData } = await supabase
          .from('products')
          .select('affiliate_settings')
          .eq('id', affiliate.product_id)
          .single();
        
        const product = productData as ProductAffiliateSettings | null;
        const defaultRate = product?.affiliate_settings?.defaultRate;
        commissionRate = defaultRate ?? 0;
        
        log.debug("commission_rate NULL, using product defaultRate:", commissionRate);
      }
      
      result.affiliateCommissionPercent = commissionRate;
      
      // Wallet do afiliado: buscar em users (SSOT)
      if (affiliate.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('asaas_wallet_id')
          .eq('id', affiliate.user_id)
          .single();
        
        const user = userData as UserData | null;
        if (user?.asaas_wallet_id) {
          result.affiliateWalletId = user.asaas_wallet_id;
        }
      }
      
      log.info("Affiliate data resolved", {
        id: result.affiliateId,
        userId: result.affiliateUserId,
        walletId: result.affiliateWalletId,
        commission: result.affiliateCommissionPercent
      });
    }
  }

  // 4. Se NÃO é Owner, buscar wallet do vendedor em users (SSOT)
  if (!result.isOwner) {
    const { data: vendorUser } = await supabase
      .from('users')
      .select('asaas_wallet_id')
      .eq('id', vendorId)
      .single();
    
    const vendor = vendorUser as UserData | null;
    result.vendorWalletId = vendor?.asaas_wallet_id || null;
    log.debug("Vendor wallet resolved", { vendorWalletId: result.vendorWalletId });
  }

  return result;
}
